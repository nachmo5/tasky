import { type Context, useContext, useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { isPropertyKey, type Store } from "./common";
import {
  type BaseGetter,
  type ConsumerGetterConfig,
  type ConsumerGetterProp,
  type ConsumerGetterResult,
  type StoreValue,
} from "./types";

export function makeUseConsumerGetters<
  TStoreBaseValue,
  TConsumerGetterConfig extends ConsumerGetterConfig<TStoreBaseValue>,
>(context: Context<Store<StoreValue<TStoreBaseValue>>>, getterConfig: TConsumerGetterConfig) {
  return function useConsumerGetters<
    const TConsumerGetterProps extends ConsumerGetterProp<TStoreBaseValue, TConsumerGetterConfig>[],
  >(getterProps: TConsumerGetterProps) {
    const store = useContext(context);

    const dependencies = JSON.stringify(getterProps);
    const baseGetters = useMemo(
      () =>
        getterProps.map((getterProp) => {
          const getterCall = (isPropertyKey(getterProp) ? { name: getterProp, args: [] } : getterProp) as Exclude<
            typeof getterProp,
            PropertyKey
          >;
          return (store: StoreValue<TStoreBaseValue>) => getterConfig[getterCall.name]!(store.base, ...getterCall.args);
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [dependencies],
    );

    const results = useBaseGetters(store, baseGetters);

    return results.reduce((acc, result, ridx) => {
      const getterProp = getterProps[ridx]!;
      const alias = isPropertyKey(getterProp) ? getterProp : (getterProp.alias ?? getterProp.name);
      return { ...acc, [alias]: result };
    }, {}) as ConsumerGetterResult<TStoreBaseValue, TConsumerGetterConfig, TConsumerGetterProps>;
  };
}

export function useBaseGetters<TStoreValue, const TBaseGetters extends BaseGetter<TStoreValue>[]>(
  store: Store<TStoreValue>,
  baseGetters: TBaseGetters,
) {
  // zustand's useStoreWithEqualityFn replaces the hand-written derived snapshot +
  // useSyncExternalStore. `shallow` compares the results array element by element, so the
  // component only re-renders when one of its getter results changes.
  return useStoreWithEqualityFn(
    store,
    (value) =>
      baseGetters.map((baseGetter) => baseGetter(value)) as {
        [index in keyof TBaseGetters]: ReturnType<TBaseGetters[index]>;
      },
    shallow,
  );
}
