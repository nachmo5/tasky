import { useContext, useEffect, useMemo, useRef, type Context } from "react";
import { type Store, updateStore } from "./common";
import {
  type ConsumerMutationConfig,
  type ConsumerMutationProp,
  type ConsumerMutationResult,
  type ConsumerSetterConfig,
  type ConsumerSetterResult,
  type ParametersExceptFirst,
  type StoreRequest,
  type StoreValue,
} from "./types";
import { useBaseGetters } from "./useGetters";

export function makeUseConsumerMutations<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TConsumerMutationConfig extends ConsumerMutationConfig<TStoreBaseValue, TConsumerSetterConfig>,
>(
  context: Context<Store<StoreValue<TStoreBaseValue>>>,
  useConsumerSetters: () => ConsumerSetterResult<TStoreBaseValue, TConsumerSetterConfig>,
  mutationConfig: TConsumerMutationConfig,
) {
  return function useConsumerMutations<
    const TConsumerMutationProp extends ConsumerMutationProp<
      TStoreBaseValue,
      TConsumerSetterConfig,
      TConsumerMutationConfig
    >[],
  >(mutationProps: TConsumerMutationProp) {
    const consumerSetters = useConsumerSetters();
    const store = useContext(context);

    // Tracks whether the component is mounted, so a mutation finishing after unmount does
    // not write its status back into the store (its entry was already cleaned up).
    const isMountedRef = useRef(false);

    const mutations: {
      name: keyof TConsumerMutationConfig;
      fn: (...args: any[]) => Promise<any>;
      id: string;
    }[] = useMemo(
      () =>
        mutationProps.map((mutationName) => {
          const mutationId = (mutationName as string) + "_" + crypto.randomUUID();
          const mutationConfigFn = mutationConfig[mutationName]!;
          // Increments on each call; only the latest call may write the status, so an older
          // call finishing late cannot overwrite the status of a newer one.
          let latestCallId = 0;
          const setRequest = (callId: number, request: StoreRequest) => {
            if (callId !== latestCallId || !isMountedRef.current) return;
            updateStore(store, (storeValue) => {
              storeValue.idToRequest[mutationId] = request;
            });
          };
          async function mutate(...args: ParametersExceptFirst<typeof mutationConfigFn>) {
            const callId = ++latestCallId;
            setRequest(callId, { status: "loading", error: undefined });
            try {
              const result = await mutationConfigFn({ get: () => store.getState().base, ...consumerSetters }, ...args);
              setRequest(callId, { status: "success", error: undefined });
              return result;
            } catch (e) {
              setRequest(callId, {
                status: "error",
                error: e instanceof Error ? e : new Error("Unknown error"),
              });
              throw e;
            }
          }
          return {
            name: mutationName,
            id: mutationId,
            fn: mutate,
          };
        }),
      // Rebuilt when the list of mutation names changes, not only when the store changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [store, mutationProps.join(",")],
    );

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        // Remove this component's mutation statuses so `idToRequest` does not grow forever.
        updateStore(store, (storeValue) => {
          mutations.forEach((mutation) => delete storeValue.idToRequest[mutation.id]);
        });
      };
    }, [mutations, store]);

    // Memoized so useBaseGetters does not unsubscribe/resubscribe on every render.
    const requestGetters = useMemo(
      () =>
        mutations.map(
          (mutation) => (storeValue: StoreValue<TStoreBaseValue>) =>
            storeValue.idToRequest[mutation.id] ?? { status: "idle" },
        ),
      [mutations],
    );
    const mutationStoreRequests = useBaseGetters(store, requestGetters);

    // Build a new callable `fn & { status, error }` when a status changes, instead of mutating
    // the same function object during render. Its identity now changes with its status, so
    // memo() and dependency arrays see the update. Initial status is "idle", matching the store.
    return useMemo(
      () =>
        mutationStoreRequests.reduce(
          (acc, mutationRequest, midx) => ({
            ...acc,
            [mutations[midx]!.name]: Object.assign((...args: unknown[]) => mutations[midx]!.fn(...args), {
              status: mutationRequest.status,
              error: mutationRequest.error,
            }),
          }),
          {},
        ),
      [mutations, mutationStoreRequests],
    ) as ConsumerMutationResult<TStoreBaseValue, TConsumerSetterConfig, TConsumerMutationConfig, TConsumerMutationProp>;
  };
}
