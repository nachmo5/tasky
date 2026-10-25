import { type Context, useState } from "react";
import { createImmerStore, type Store } from "./common";
import { type StoreValue } from "./types";

export function makeStoreProvider<TStoreBaseValue>(context: Context<Store<StoreValue<TStoreBaseValue>>>) {
  return function StoreProvider(props: { initialValue: TStoreBaseValue; children: React.ReactNode }) {
    // Create the store once per provider instance (lazy useState initializer) instead of on
    // every render. Re-renders (parent updates, StrictMode, concurrent rendering) no longer
    // reset the state or leave consumers pointing at a stale store. Still SSR-safe: each
    // server request renders a new tree, so it gets its own store.
    // Note: `initialValue` is only read on the first render; later changes are ignored.
    // The store is a zustand vanilla store (createImmerStore); one per provider instance is
    // also zustand's recommended setup for SSR.
    const [store] = useState(() =>
      createImmerStore<StoreValue<TStoreBaseValue>>({
        base: props.initialValue,
        idToRequest: {},
      }),
    );
    return <context.Provider value={store}>{props.children}</context.Provider>;
  };
}
