import { useContext, useEffect, useMemo, type Context } from "react";
import { isPropertyKey, mapObject, type Store, updateStore } from "./common";
import {
  type ConsumerQueryConfig,
  type ConsumerQueryProp,
  type ConsumerQueryResult,
  type ConsumerSetterConfig,
  type ConsumerSetterResult,
  type StoreRequest,
  type StoreValue,
} from "./types";
import { useBaseGetters } from "./useGetters";

// Shared registry of running/settled queries, one per store, keyed by query id (name + args).
// It lets several components using the same query share one request (deduplication), and
// counts how many components use each query so it is only torn down when the last one leaves.
type QueryEntry = {
  name: string;
  refCount: number;
  controller: AbortController;
  fetch: (signal: AbortSignal) => Promise<StoreRequest>;
  gcTimer?: ReturnType<typeof setTimeout>;
};
const storeToQueryRegistry = new WeakMap<Store<any>, Map<string, QueryEntry>>();

function getQueryRegistry(store: Store<any>) {
  let registry = storeToQueryRegistry.get(store);
  if (!registry) {
    registry = new Map();
    storeToQueryRegistry.set(store, registry);
  }
  return registry;
}

export function makeUseConsumerQueries<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TConsumerQueryConfig extends ConsumerQueryConfig<TStoreBaseValue, TConsumerSetterConfig>,
>(
  context: Context<Store<StoreValue<TStoreBaseValue>>>,
  useConsumerSetters: () => ConsumerSetterResult<TStoreBaseValue, TConsumerSetterConfig>,
  queryConfig: TConsumerQueryConfig,
) {
  return function useConsumerQueries<
    const TConsumerQueryProps extends ConsumerQueryProp<TStoreBaseValue, TConsumerSetterConfig, TConsumerQueryConfig>[],
  >(queryProps: TConsumerQueryProps) {
    const store = useContext(context);
    const consumerSetters = useConsumerSetters();

    const queries: {
      name: keyof TConsumerQueryConfig;
      alias: string;
      fn: (signal: AbortSignal) => Promise<StoreRequest>;
      id: string;
    }[] = useMemo(
      () =>
        queryProps.map((queryProp) => {
          const queryCall = (isPropertyKey(queryProp) ? { name: queryProp, args: [] } : queryProp) as Exclude<
            typeof queryProp,
            PropertyKey
          >;

          return {
            name: queryCall.name,
            alias: queryCall.alias ?? queryCall.name,
            id: (queryCall.name as string) + "_" + queryCall.args.map((arg) => JSON.stringify(arg)).join(","),
            fn: (signal: AbortSignal) =>
              queryConfig[queryCall.name]!(
                {
                  get: () => store.getState().base,
                  signal,
                  // Setters become no-ops once the query is aborted, so a stale response
                  // that resolves late cannot overwrite newer data.
                  ...(mapObject(consumerSetters, (_, setter) => (...args: any[]) => {
                    if (!signal.aborted) (setter as (...args: any[]) => void)(...args);
                  }) as typeof consumerSetters),
                },
                ...queryCall.args,
              )
                .then(() => ({ status: "success" as const }))
                .catch((e) => ({
                  status: "error" as const,
                  error: e instanceof Error ? e : new Error("Unknown error"),
                })),
          };
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(queryProps), store],
    );

    useEffect(() => {
      const registry = getQueryRegistry(store);

      // Acquire each query: reuse the in-flight/settled entry if another component already
      // started it, otherwise start it. Each query updates its own status as soon as it
      // settles (no more Promise.all making fast queries wait for slow ones).
      queries.forEach((query) => {
        const existing = registry.get(query.id);
        if (existing) {
          existing.refCount++;
          clearTimeout(existing.gcTimer);
          return;
        }
        const entry: QueryEntry = {
          name: query.name as string,
          refCount: 1,
          controller: new AbortController(),
          fetch: query.fn,
        };
        registry.set(query.id, entry);
        updateStore(store, (storeValue) => {
          storeValue.idToRequest[query.id] = { status: "loading" };
        });
        void runQuery(store, query.id, entry);
      });

      return () => {
        // Release each query. When no component uses it anymore, abort it and remove its
        // status from the store (prevents leaks). Teardown is deferred one tick so a quick
        // unmount/remount (StrictMode, moving a component) reuses the request instead of refetching.
        queries.forEach((query) => {
          const entry = registry.get(query.id);
          if (!entry) return;
          entry.refCount--;
          if (entry.refCount > 0) return;
          entry.gcTimer = setTimeout(() => {
            if (entry.refCount > 0 || registry.get(query.id) !== entry) return;
            entry.controller.abort();
            registry.delete(query.id);
            updateStore(store, (storeValue) => {
              delete storeValue.idToRequest[query.id];
            });
          }, 0);
        });
      };
      // `queries` is memoized on the serialized props, so this replaces the previous
      // variable-length dependency array (which React warns about when its size changes).
    }, [queries, store]);

    // Memoized so useBaseGetters gets the same getters array between renders and does not
    // unsubscribe/resubscribe to the store on every render.
    const requestGetters = useMemo(
      () =>
        queries.map(
          (query) => (storeValue: StoreValue<TStoreBaseValue>) =>
            storeValue.idToRequest[query.id] ?? { status: "loading" },
        ),
      [queries],
    );
    const queryRequests = useBaseGetters(store, requestGetters);

    return queryRequests.reduce(
      (acc, queryRequest, qidx) => ({
        ...acc,
        [queries[qidx]!.alias]: queryRequest,
      }),
      {},
    ) as ConsumerQueryResult<TStoreBaseValue, TConsumerSetterConfig, TConsumerQueryConfig, TConsumerQueryProps>;
  };
}

export function refetchQueries(store: Store<any>, queryName: string) {
  const refetches = [...getQueryRegistry(store)]
    .filter(([, entry]) => entry.name === queryName && entry.refCount > 0)
    .map(([queryId, entry]) => {
      entry.controller.abort();
      entry.controller = new AbortController();
      return runQuery(store, queryId, entry);
    });
  return Promise.all(refetches).then(() => undefined);
}

function runQuery(store: Store<any>, queryId: string, entry: QueryEntry) {
  const { signal } = entry.controller;
  return entry.fetch(signal).then((storeRequest) => {
    if (signal.aborted) return;
    updateStore(store, (storeValue: StoreValue<unknown>) => {
      storeValue.idToRequest[queryId] = storeRequest;
    });
  });
}
