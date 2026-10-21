import { act, render } from "@testing-library/react";
import { type ReactNode } from "react";
import { vi } from "vitest";
import { createStore } from "../index";

export type Todo = { title: string; isDone: boolean };
export type TodoState = { todos: Todo[] };

// Fake API: each test decides when and how its calls settle
export const api = {
  loadTodos: vi.fn<(userId: string, signal: AbortSignal) => Promise<Todo[]>>(),
  saveTodo: vi.fn<(title: string) => Promise<void>>(),
};

export const TodoStore = createStore<TodoState>()
  .addGetters({
    todos: (state) => state.todos,
    remaining: (state) => state.todos.filter((todo) => !todo.isDone).length,
    todoTitle: (state, index: number) => state.todos[index]?.title,
  })
  .addSetters({
    setTodos: (state, todos: Todo[]) => {
      state.todos = todos;
    },
    pushTodo: (state, title: string) => {
      state.todos.push({ title, isDone: false });
    },
    renameTodo: (state, index: number, title: string) => {
      state.todos[index]!.title = title;
    },
    toggleTodo: (state, index: number) => {
      state.todos[index]!.isDone = !state.todos[index]!.isDone;
    },
  })
  .addQueries({
    loadTodos: async ({ setTodos, signal }, userId: string) => {
      setTodos(await api.loadTodos(userId, signal));
    },
  })
  .addMutations({
    addTodo: async ({ pushTodo }, title: string) => {
      await api.saveTodo(title);
      pushTodo(title);
    },
    addTodoAndRefetch: async ({ refetchQueries }, title: string) => {
      await api.saveTodo(title);
      await refetchQueries("loadTodos");
    },
  });

export const initialState: TodoState = {
  todos: [
    { title: "a", isDone: false },
    { title: "b", isDone: true },
  ],
};

// Renders inside a fresh StoreProvider; `rerender` keeps the same provider (and store)
export function renderWithStore(ui: ReactNode, initialValue: TodoState = initialState) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TodoStore.StoreProvider initialValue={initialValue}>{children}</TodoStore.StoreProvider>
    ),
  });
}

// Shows the todo titles, to observe the store from outside the component under test
export function TodosProbe() {
  const { todos } = TodoStore.useGetters(["todos"]);
  return <p data-testid="todos">{todos.map((todo) => todo.title).join(",")}</p>;
}

export function buildDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Runs `update` (e.g. resolving a deferred promise) and lets the resulting promise callbacks and re-renders finish
export async function actAndFlush(update: () => void = () => {}) {
  await act(async () => {
    update();
    await Promise.resolve();
  });
}

// Unused queries are torn down after a 0ms timeout; this lets that timeout run
export function flushQueryTeardown() {
  return act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}
