# state-manager

A typed store for React where **components declare the state and async data they need by name**, and the library handles subscriptions, fetching, loading states and re-renders.

```tsx
<TodoStore.StoreConsumer
  getters={["remaining", { name: "todo", args: [0], alias: "firstTodo" }]}
  queries={[{ name: "loadTodos", args: [userId] }]}
  mutations={["addTodo"]}
  loader={<Spinner />}
>
  {({ remaining, firstTodo, addTodo }) => (
    <button disabled={addTodo.status === "loading"} onClick={() => addTodo("Buy milk")}>
      {remaining} left — first: {firstTodo}
    </button>
  )}
</TodoStore.StoreConsumer>
```

There are no selector functions, no `isLoading` flags, no `useEffect` to start the fetch, and no type annotations: everything above is inferred from one store definition.

## Why another state library?

zustand, Redux Toolkit, Jotai and TanStack Query are all excellent, and this library doesn't replace their engines; its store core **is** zustand with the immer middleware. What it adds is a different way to _use_ a store, which no one of them gives you as a whole.

### 1. Components ask for state by name, as data

With most libraries, reading state means writing a selector function in every component:

```tsx
const todo = useStore((s) => s.todos[index]);           // zustand
const remaining = useStore(useShallow((s) => ...));      // derived values need extra care
```

Here, you define getters once and request them by name. Getters can take arguments and be renamed:

```tsx
const { remaining, firstTodo } = TodoStore.useGetters(["remaining", { name: "todo", args: [0], alias: "firstTodo" }]);
```

The result is fully typed (`firstTodo` is `string | undefined`, and passing `"0"` instead of `0` is a compile error), memoized by its arguments, and the component re-renders only when one of the requested values changes.

Because the request is plain data rather than a function, the library can derive things from it: the same name and arguments act as the key that deduplicates queries.

### 2. One definition for sync state, async work and request status

Getters, setters, queries and mutations are declared together, and each one is typed from the ones before it:

```ts
type TodoState = { todos: { title: string; done: boolean }[] };

export const TodoStore = createStore<TodoState>()
  .addGetters({
    remaining: (state) => state.todos.filter((todo) => !todo.done).length,
    todo: (state, index: number) => state.todos[index]?.title,
  })
  .addSetters({
    // immer: write mutations, get immutable updates
    setTodos: (state, todos: TodoState["todos"]) => {
      state.todos = todos;
    },
    pushTodo: (state, title: string) => {
      state.todos.push({ title, done: false });
    },
  })
  .addQueries({
    loadTodos: async ({ setTodos, signal }, userId: string) => {
      const response = await fetch(`/api/users/${userId}/todos`, { signal });
      setTodos(await response.json());
    },
  })
  .addMutations({
    addTodo: async ({ pushTodo }, title: string) => {
```

### 3. Refreshing queries after a mutation

A mutation receives `refetchQueries(queryName)` next to its setters. It re-runs every **mounted** query
with that name, each with its own args, and resolves when they have all settled:

```ts
.addMutations({
  addTodo: async ({ refetchQueries }, title: string) => {
    await fetch("/api/todos", { method: "POST", body: JSON.stringify({ title }) });
    await refetchQueries("loadTodos");
  },
})
```

- **Background refresh**: the query keeps its current status (no `loading` flash) and its data until the
  new data arrives.
- **Only mounted queries** re-run. A query nobody displays fetches fresh data when it is mounted again.
- **Requests in flight are aborted** first, so an older response can't overwrite the refreshed data.
- **The name is typed** from `addQueries`, so add queries before mutations in the builder chain.
