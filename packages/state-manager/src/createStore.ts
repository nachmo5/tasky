import { createContext } from "react";
import { type Store } from "./common";
import { createConsumers } from "./consumers";
import { makeStoreProvider } from "./StoreProvider";
import {
  type ConsumerGetterConfig,
  type ConsumerMutationConfig,
  type ConsumerQueryConfig,
  type ConsumerSetterConfig,
  type StoreValue,
} from "./types";

export function createStore<TStoreBaseValue>() {
  // One context for the whole builder chain (it used to be created at every step), so a
  // StoreProvider from any step works with consumers from any other step.
  const context = createContext<Store<StoreValue<TStoreBaseValue>>>(
    undefined as unknown as Store<StoreValue<TStoreBaseValue>>,
  );
  const StoreProvider = makeStoreProvider(context);

  function createStoreBuilder<
    TConsumerGetterConfig extends ConsumerGetterConfig<TStoreBaseValue>,
    TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
    TConsumerQueryConfig extends ConsumerQueryConfig<TStoreBaseValue, TConsumerSetterConfig>,
    TConsumerMutationConfig extends ConsumerMutationConfig<TStoreBaseValue, TConsumerSetterConfig>,
  >(actionsConfig: {
    getters: TConsumerGetterConfig;
    setters: TConsumerSetterConfig;
    queries: TConsumerQueryConfig;
    mutations: TConsumerMutationConfig;
  }) {
    // The add* methods now merge with the existing config instead of replacing it, and keep
    // the types of the other sections (they were reset to `any`).
    return {
      StoreProvider,
      ...createConsumers(context, actionsConfig),
      addGetters<TNextGetterConfig extends ConsumerGetterConfig<TStoreBaseValue>>(nextGetters: TNextGetterConfig) {
        return createStoreBuilder<
          TConsumerGetterConfig & TNextGetterConfig,
          TConsumerSetterConfig,
          TConsumerQueryConfig,
          TConsumerMutationConfig
        >({
          ...actionsConfig,
          getters: { ...actionsConfig.getters, ...nextGetters },
        });
      },
      addSetters<TNextSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>>(nextSetters: TNextSetterConfig) {
        return createStoreBuilder<
          TConsumerGetterConfig,
          TConsumerSetterConfig & TNextSetterConfig,
          TConsumerQueryConfig,
          TConsumerMutationConfig
        >({
          ...actionsConfig,
          setters: { ...actionsConfig.setters, ...nextSetters },
        });
      },
      addQueries<TNextQueryConfig extends ConsumerQueryConfig<TStoreBaseValue, TConsumerSetterConfig>>(
        nextQueries: TNextQueryConfig,
      ) {
        return createStoreBuilder<
          TConsumerGetterConfig,
          TConsumerSetterConfig,
          TConsumerQueryConfig & TNextQueryConfig,
          TConsumerMutationConfig
        >({
          ...actionsConfig,
          queries: { ...actionsConfig.queries, ...nextQueries },
        });
      },
      addMutations<TNextMutationConfig extends ConsumerMutationConfig<TStoreBaseValue, TConsumerSetterConfig>>(
        nextMutations: TNextMutationConfig,
      ) {
        return createStoreBuilder<
          TConsumerGetterConfig,
          TConsumerSetterConfig,
          TConsumerQueryConfig,
          TConsumerMutationConfig & TNextMutationConfig
        >({
          ...actionsConfig,
          mutations: { ...actionsConfig.mutations, ...nextMutations },
        });
      },
    };
  }
  return createStoreBuilder({
    getters: {},
    setters: {},
    queries: {},
    mutations: {},
  });
}
