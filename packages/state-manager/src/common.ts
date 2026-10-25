import { type Draft } from "immer";
import { createStore, type Mutate, type StoreApi } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";

// The store is now a zustand vanilla store with the immer middleware, replacing the custom
// Store class (listeners, set/subscribe and derived snapshots). zustand handles subscriptions
// and already skips notifying listeners when immer returns the same reference (no change).
export type Store<TStoreValue> = Mutate<StoreApi<TStoreValue>, [["zustand/immer", never]]>;

export function createImmerStore<TStoreValue>(value: TStoreValue): Store<TStoreValue> {
  return createStore<TStoreValue>()(immer(() => value));
}

// Applies an immer recipe to the store. The cast keeps setters typed against the plain state
// type, as before, instead of immer's Draft<T> (which TypeScript cannot resolve for generic T).
export function updateStore<TStoreValue>(store: Store<TStoreValue>, recipe: (value: TStoreValue) => void): void {
  store.setState((draft: Draft<TStoreValue>) => {
    recipe(draft as TStoreValue);
  });
}

export function isPropertyKey(input: unknown): input is PropertyKey {
  return typeof input === "symbol" || typeof input === "number" || typeof input === "string";
}

export function isObjectPropertyKey<TObject extends object>(obj: TObject, input: unknown): input is keyof TObject {
  return isPropertyKey(input) && input in obj;
}

type MappedObject<T extends Record<string, any>, R> = {
  [K in keyof T]: R;
};

/**
 * Maps the values of an object while preserving all original keys.
 * * @param obj The input object.
 * @param mapFn A function that receives the key and value, and returns the new value.
 * @returns A new object with the same keys but transformed values.
 */
export function mapObject<T extends Record<string, any>, R>(
  obj: T,
  mapFn: (key: keyof T, value: T[keyof T]) => R,
): MappedObject<T, R> {
  const entries = Object.entries(obj);

  const mappedEntries = entries.map(([key, value]) => {
    // The key must be cast to keyof T to satisfy the mapFn signature
    const newKey = key as keyof T;
    const newValue = mapFn(newKey, value);

    // Return the [key, newValue] pair
    return [key, newValue];
  });

  // Object.fromEntries returns a generic Record<string, any>.
  // We use 'as MappedObject<T, R>' to enforce the calculated type safety.
  return Object.fromEntries(mappedEntries) as MappedObject<T, R>;
}
