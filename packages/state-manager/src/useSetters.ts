import { useContext, useMemo, type Context } from "react";
import type { ConsumerSetterConfig, StoreValue, ParametersExceptFirst, ConsumerSetterResult } from "./types";
import { type Store, mapObject, updateStore } from "./common";

export function makeUseConsumerSetters<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
>(context: Context<Store<StoreValue<TStoreBaseValue>>>, setterConfig: TConsumerSetterConfig) {
  return function useConsumerSetters() {
    const store = useContext(context);
    return useMemo(
      () =>
        mapObject(setterConfig, (_, setterConfigFn) => (...args: ParametersExceptFirst<typeof setterConfigFn>) => {
          updateStore(store, (draft) => setterConfigFn(draft.base, ...args));
        }),
      // Depend on `store` so setters are rebuilt if the provider's store ever changes,
      // instead of writing to a store that consumers no longer read from.
      [store],
    ) as ConsumerSetterResult<TStoreBaseValue, TConsumerSetterConfig>;
  };
}
