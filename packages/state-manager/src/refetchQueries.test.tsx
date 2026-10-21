import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createStore } from "./index";
import {
  actAndFlush,
  api,
  buildDeferred,
  flushQueryTeardown,
  renderWithStore,
  TodoStore,
  TodosProbe,
  type Todo,
} from "./testing/fixtures";

function TodoList({ userId, testId = "list" }: { userId: string; testId?: string }) {
  const { loadTodos } = TodoStore.useQueries([{ name: "loadTodos", args: [userId] }]);
  return <p data-testid={testId}>{loadTodos.status}</p>;
}

function AddTodoButton() {
  const { addTodoAndRefetch } = TodoStore.useMutations(["addTodoAndRefetch"]);
  return <button onClick={() => void addTodoAndRefetch("new")}>{addTodoAndRefetch.status}</button>;
}

function getLoadedUserIds() {
  return api.loadTodos.mock.calls.map(([userId]) => userId);
}

beforeEach(() => {
  api.loadTodos.mockReset();
  api.saveTodo.mockReset();
  api.saveTodo.mockResolvedValue();
});

describe("refetchQueries", () => {
  it("re-runs a mounted query with its own args and keeps its status while refetching", async () => {
    const refetchResponse = buildDeferred<Todo[]>();
    api.loadTodos.mockResolvedValueOnce([{ title: "a", isDone: false }]).mockReturnValueOnce(refetchResponse.promise);
    renderWithStore(
      <>
        <TodoList userId="u1" />
        <TodosProbe />
        <AddTodoButton />
      </>,
    );
    await actAndFlush();

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();

    expect(getLoadedUserIds()).toEqual(["u1", "u1"]);
    expect(screen.getByTestId("list").textContent).toBe("success");
    expect(screen.getByRole("button").textContent).toBe("loading");

    await actAndFlush(() =>
      refetchResponse.resolve([
        { title: "a", isDone: false },
        { title: "new", isDone: false },
      ]),
    );

    expect(screen.getByTestId("todos").textContent).toBe("a,new");
    expect(screen.getByRole("button").textContent).toBe("success");
  });

  it("re-runs every mounted query with that name, once per distinct args", async () => {
    api.loadTodos.mockResolvedValue([]);
    renderWithStore(
      <>
        <TodoList userId="u1" testId="first" />
        <TodoList userId="u1" testId="second" />
        <TodoList userId="u2" testId="third" />
        <AddTodoButton />
      </>,
    );
    await actAndFlush();

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();

    expect(getLoadedUserIds()).toEqual(["u1", "u2", "u1", "u2"]);
  });

  it("does not run queries that are no longer mounted", async () => {
    api.loadTodos.mockResolvedValue([]);
    function App({ isListVisible }: { isListVisible: boolean }) {
      return (
        <>
          {isListVisible && <TodoList userId="u1" />}
          <AddTodoButton />
        </>
      );
    }
    const { rerender } = renderWithStore(<App isListVisible />);
    await actAndFlush();
    rerender(<App isListVisible={false} />);
    await flushQueryTeardown();

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();

    expect(getLoadedUserIds()).toEqual(["u1"]);
    expect(screen.getByRole("button").textContent).toBe("success");
  });

  it("aborts a request still in flight so its late response is ignored", async () => {
    const firstResponse = buildDeferred<Todo[]>();
    api.loadTodos.mockReturnValueOnce(firstResponse.promise).mockResolvedValueOnce([{ title: "fresh", isDone: false }]);
    renderWithStore(
      <>
        <TodoList userId="u1" />
        <TodosProbe />
        <AddTodoButton />
      </>,
    );

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();
    await actAndFlush(() => firstResponse.resolve([{ title: "stale", isDone: false }]));

    expect(api.loadTodos.mock.calls[0]![1].aborted).toBe(true);
    expect(screen.getByTestId("todos").textContent).toBe("fresh");
    expect(screen.getByTestId("list").textContent).toBe("success");
  });

  it("leaves queries with another name alone", async () => {
    const fetchedQueryNames: string[] = [];
    const store = createStore<Record<never, never>>()
      .addQueries({
        loadFirst: () => {
          fetchedQueryNames.push("loadFirst");
          return Promise.resolve();
        },
        loadSecond: () => {
          fetchedQueryNames.push("loadSecond");
          return Promise.resolve();
        },
      })
      .addMutations({
        save: async ({ refetchQueries }) => {
          await refetchQueries("loadFirst");
        },
      });
    function Screen() {
      store.useQueries(["loadFirst", "loadSecond"]);
      const { save } = store.useMutations(["save"]);
      return <button onClick={() => void save()}>{save.status}</button>;
    }
    render(
      <store.StoreProvider initialValue={{}}>
        <Screen />
      </store.StoreProvider>,
    );
    await actAndFlush();

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();

    expect(fetchedQueryNames).toEqual(["loadFirst", "loadSecond", "loadFirst"]);
  });

  it("only accepts the names of the store's queries", async () => {
    const store = createStore<{ count: number }>()
      .addQueries({ loadCount: async () => {} })
      .addMutations({
        saveCount: async ({ refetchQueries }) => {
          await refetchQueries("loadCount");
          // @ts-expect-error unknown query name
          await refetchQueries("loadCuont");
        },
      });
    function Saver() {
      const { saveCount } = store.useMutations(["saveCount"]);
      return <button onClick={() => void saveCount()}>{saveCount.status}</button>;
    }
    render(
      <store.StoreProvider initialValue={{ count: 0 }}>
        <Saver />
      </store.StoreProvider>,
    );

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();

    expect(screen.getByRole("button").textContent).toBe("success");
  });
});
