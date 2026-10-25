import { type ReactNode } from "react";

export type RequestStatus = "idle" | "loading" | "error" | "success";
export type StoreRequest = { status: RequestStatus; error?: Error };

export type StoreValue<TStoreBaseValue> = {
  base: TStoreBaseValue;
  idToRequest: Record<string, StoreRequest>;
};

export type BaseGetter<TStoreValue> = (storeValue: TStoreValue) => any;
export type BaseSetter<TStoreValue> = (storeValue: TStoreValue) => void;

// ==========================================================================
// =============================== CONFIG ===================================
// ==========================================================================
// Functions
type ConsumerGetter<TStoreBaseValue> = (storeBaseValue: TStoreBaseValue, ...args: any[]) => any;
type ConsumerSetter<TStoreBaseValue> = (storeBaseValue: TStoreBaseValue, ...args: any[]) => void;
type ConsumerRequest<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  // Extra fields given to the request's `store` argument (queries also receive an AbortSignal).
  TExtraStore = Record<never, never>,
> = (
  store: { get: () => TStoreBaseValue } & ConsumerSetterResult<TStoreBaseValue, TConsumerSetterConfig> & TExtraStore,
  ...args: any[]
) => Promise<void>;
// Config
export type ConsumerGetterConfig<TStoreBaseValue> = Record<string, ConsumerGetter<TStoreBaseValue>>;
export type ConsumerSetterConfig<TStoreBaseValue> = Record<string, ConsumerSetter<TStoreBaseValue>>;
export type ConsumerQueryConfig<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  // Queries receive `signal`, aborted when no component uses the query anymore (unmount or
  // args change). Pass it to fetch() to cancel the request; setters are ignored once aborted.
> = Record<string, ConsumerRequest<TStoreBaseValue, TConsumerSetterConfig, { signal: AbortSignal }>>;

export type ConsumerMutationConfig<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TQueryName extends string = string,
> = Record<
  string,
  ConsumerRequest<TStoreBaseValue, TConsumerSetterConfig, { refetchQueries: (queryName: TQueryName) => Promise<void> }>
>;

// ==========================================================================
// =============================== PROPS ====================================
// ==========================================================================

export type GetterCall<
  TStoreValue,
  TConsumerGetterConfig extends ConsumerGetterConfig<TStoreValue>,
  TName extends string,
> = {
  name: TName;
  args: ParametersExceptFirst<TConsumerGetterConfig[TName]>;
  alias?: string;
};
export type ConsumerGetterProp<TStoreBaseValue, TConsumerGetterConfig extends ConsumerGetterConfig<TStoreBaseValue>> = {
  [name in Extract<keyof TConsumerGetterConfig, string>]:
    name | GetterCall<TStoreBaseValue, TConsumerGetterConfig, name>;
}[Extract<keyof TConsumerGetterConfig, string>];

export type ConsumerQueryProp<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TConsumerQueryConfig extends ConsumerQueryConfig<TStoreBaseValue, TConsumerSetterConfig>,
> = {
  [name in Extract<keyof TConsumerQueryConfig, string>]:
    | name
    | {
        name: name;
        args: ParametersExceptFirst<TConsumerQueryConfig[name]>;
        alias?: string;
      };
}[Extract<keyof TConsumerQueryConfig, string>];

export type ConsumerMutationProp<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TConsumerMutationConfig extends ConsumerMutationConfig<TStoreBaseValue, TConsumerSetterConfig>,
> = Extract<keyof TConsumerMutationConfig, string>;

// ==========================================================================
// ============================= RESULTS ====================================
// ==========================================================================

export type ConsumerGetterResult<
  TStoreBaseValue,
  TConsumerGetterConfig extends ConsumerGetterConfig<TStoreBaseValue>,
  TConsumerGetterProps extends readonly ConsumerGetterProp<TStoreBaseValue, TConsumerGetterConfig>[],
> = {
  [nameOrCall in TConsumerGetterProps[number] as ExtractAlias<nameOrCall>]: ReturnType<
    TConsumerGetterConfig[ExtractName<nameOrCall>]
  >;
};

export type ConsumerSetterResult<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
> = {
  [name in keyof TConsumerSetterConfig]: (...args: ParametersExceptFirst<TConsumerSetterConfig[name]>) => void;
};

export type ConsumerQueryResult<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TConsumerQueryConfig extends ConsumerQueryConfig<TStoreBaseValue, TConsumerSetterConfig>,
  TConsumerQueryProps extends readonly ConsumerQueryProp<
    TStoreBaseValue,
    TConsumerSetterConfig,
    TConsumerQueryConfig
  >[],
> = {
  [nameOrCall in TConsumerQueryProps[number] as ExtractAlias<nameOrCall>]: StoreRequest;
};
export type ConsumerMutationResult<
  TStoreBaseValue,
  TConsumerSetterConfig extends ConsumerSetterConfig<TStoreBaseValue>,
  TConsumerMutationConfig extends ConsumerMutationConfig<TStoreBaseValue, TConsumerSetterConfig>,
  TConsumerMutationProps extends readonly ConsumerMutationProp<
    TStoreBaseValue,
    TConsumerSetterConfig,
    TConsumerMutationConfig
  >[],
> = {
  [name in TConsumerMutationProps[number]]: ((
    ...args: ParametersExceptFirst<TConsumerMutationConfig[name]>
  ) => Promise<void>) &
    StoreRequest;
};
// ==========================================================================
// =========================== STORE CONSUMER ===============================
// ==========================================================================

export type StoreConsumerProps<
  TStoreBaseValue,
  TConfig extends {
    getters: ConsumerGetterConfig<TStoreBaseValue>;
    setters: ConsumerSetterConfig<TStoreBaseValue>;
    queries: ConsumerQueryConfig<TStoreBaseValue, TConfig["setters"]>;
    mutations: ConsumerMutationConfig<TStoreBaseValue, TConfig["setters"]>;
  },
  TGetterProps extends ConsumerGetterProp<TStoreBaseValue, TConfig["getters"]>[] = [],
  TQueryProps extends ConsumerQueryProp<TStoreBaseValue, TConfig["setters"], TConfig["queries"]>[] = [],
  TMutationProps extends ConsumerMutationProp<TStoreBaseValue, TConfig["setters"], TConfig["mutations"]>[] = [],
> = {
  getters?: TGetterProps;
  queries?: TQueryProps;
  mutations?: TMutationProps;
  loader?: ReactNode;
  children: (
    renderProps: ConsumerGetterResult<TStoreBaseValue, TConfig["getters"], TGetterProps> &
      ConsumerSetterResult<TStoreBaseValue, TConfig["setters"]> &
      ConsumerQueryResult<TStoreBaseValue, TConfig["setters"], TConfig["queries"], TQueryProps> &
      ConsumerMutationResult<TStoreBaseValue, TConfig["setters"], TConfig["mutations"], TMutationProps>,
  ) => ReactNode;
};

// ==========================================================================
// =============================== UTILS ====================================
// ==========================================================================

export type ParametersExceptFirst<T extends (...args: any) => any> = T extends (arg0: any, ...rest: infer R) => any
  ? R
  : never;

export type PropertyKey = string | number | symbol;

export type ExtractAlias<T> = T extends string
  ? T
  : T extends { alias: infer A extends string }
    ? A
    : T extends { name: infer N extends string }
      ? N
      : never;

export type ExtractName<T> = T extends { name: infer N extends string } ? N : T extends string ? T : never;
