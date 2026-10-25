import { type Context } from "react";
import { StoreLoader } from "./boundary";
import { type Store } from "./common";
import {
  type ConsumerGetterConfig,
  type ConsumerGetterProp,
  type ConsumerMutationConfig,
  type ConsumerMutationProp,
  type ConsumerQueryConfig,
  type ConsumerQueryProp,
  type ConsumerSetterConfig,
  type StoreConsumerProps,
  type StoreValue,
} from "./types";
import { makeUseConsumerGetters } from "./useGetters";
import { makeUseConsumerMutations } from "./useMutations";
import { makeUseConsumerQueries } from "./useQueries";
import { makeUseConsumerSetters } from "./useSetters";

export function createConsumers<
  TStoreBaseValue,
  TConfig extends {
    getters: ConsumerGetterConfig<TStoreBaseValue>;
    setters: ConsumerSetterConfig<TStoreBaseValue>;
    queries: ConsumerQueryConfig<TStoreBaseValue, TConfig["setters"]>;
    mutations: ConsumerMutationConfig<TStoreBaseValue, TConfig["setters"]>;
  },
>(context: Context<Store<StoreValue<TStoreBaseValue>>>, config: TConfig) {
  const useGetters = makeUseConsumerGetters(context, config.getters as TConfig["getters"]);
  const useSetters = makeUseConsumerSetters(context, config.setters as TConfig["setters"]); // dont know why we need the "as" without it it doesnt work
  const useQueries = makeUseConsumerQueries(context, useSetters, config.queries as TConfig["queries"]);
  const useMutations = makeUseConsumerMutations(context, useSetters, config.mutations as TConfig["mutations"]);

  function StoreConsumer<
    const TGetterProps extends ConsumerGetterProp<TStoreBaseValue, TConfig["getters"]>[] = [],
    const TQueryProps extends ConsumerQueryProp<TStoreBaseValue, TConfig["setters"], TConfig["queries"]>[] = [],
    const TMutationProps extends ConsumerMutationProp<TStoreBaseValue, TConfig["setters"], TConfig["mutations"]>[] = [],
  >(props: StoreConsumerProps<TStoreBaseValue, TConfig, TGetterProps, TQueryProps, TMutationProps>) {
    const getterResults = useGetters(props.getters ?? []);
    const setterResults = useSetters();
    const queryResults = useQueries(props.queries ?? []);
    const mutationResults = useMutations(props.mutations ?? []);

    const renderChildren = () =>
      props.children({
        ...getterResults,
        ...setterResults,
        ...queryResults,
        ...mutationResults,
      });

    if (props.loader) {
      // Children are passed as a function so they are not rendered while the loader shows.
      // Only queries drive the loader: a running mutation (e.g. a form submit) no longer
      // swaps the UI for the loader, which would unmount the form and lose its local state.
      return (
        <StoreLoader
          loader={props.loader}
          statuses={Object.values(queryResults).map((queryResult) => (queryResult as any).status)}
        >
          {renderChildren}
        </StoreLoader>
      );
    }
    return renderChildren();
  }

  return {
    useGetters,
    useSetters,
    useQueries,
    useMutations,
    StoreConsumer,
  };
}
