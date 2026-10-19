import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  actAndFlush,
  api,
  deferred,
  flushQueryTeardown,
  initialState,
  renderWithStore,
  TodoStore,
  TodosProbe,
  type Todo,
} from "./testing/fixtures";

function TodoList({ userId, testId = "list" }: { userId: string; testId?: string }) {
  const { loadTodos } = TodoStore.useQueries([{ name: "loadTodos", args: [userId] }]);
  return <p data-testid={testId}>{`${loadTodos.status}${loadTodos.error ? `:${loadTodos.error.message}` : ""}`}</p>;
}

function signalOfCall(callIndex: number) {
  return api.loadTodos.mock.calls[callIndex]![1];
}

beforeEach(() => {
  api.loadTodos.mockReset();
});

describe("queries", () => {
  it("start on mount, report loading, then success with the data written by setters", async () => {
    const response = deferred<Todo[]>();
    api.loadTodos.mockReturnValue(response.promise);
    renderWithStore(
      <>
        <TodoList userId="u1" />
        <TodosProbe />
      </>,
    );

    expect(api.loadTodos).toHaveBeenCalledWith("u1", expect.any(AbortSignal));
    expect(screen.getByTestId("list").textContent).toBe("loading");

    await actAndFlush(() => response.resolve([{ title: "loaded", done: false }]));

    expect(screen.getByTestId("list").textContent).toBe("success");
    expect(screen.getByTestId("todos").textContent).toBe("loaded");
  });

  it("report an error status with the thrown error", async () => {
    api.loadTodos.mockRejectedValue(new Error("network down"));
    renderWithStore(<TodoList userId="u1" />);

    await actAndFlush();

    expect(screen.getByTestId("list").textContent).toBe("error:network down");
  });

  it("share one request between components using the same name and args", async () => {
    api.loadTodos.mockResolvedValue([]);
    renderWithStore(
      <>
        <TodoList userId="u1" testId="first" />
        <TodoList userId="u1" testId="second" />
        <TodoList userId="u2" testId="third" />
      </>,
    );
    await actAndFlush();

    expect(api.loadTodos).toHaveBeenCalledTimes(2);
    expect(api.loadTodos.mock.calls.map(([userId]) => userId)).toEqual(["u1", "u2"]);
    expect(screen.getByTestId("second").textContent).toBe("success");
  });

  it("abort when the last component using them unmounts, and ignore the late response", async () => {
    const response = deferred<Todo[]>();
    api.loadTodos.mockReturnValue(response.promise);
    function App({ showList }: { showList: boolean }) {
      return (
        <>
          {showList && <TodoList userId="u1" />}
          <TodosProbe />
        </>
      );
    }
    const { rerender } = renderWithStore(<App showList />);

    rerender(<App showList={false} />);
    // teardown is deferred so a quick remount can reuse the request
    expect(signalOfCall(0).aborted).toBe(false);
    await flushQueryTeardown();
    expect(signalOfCall(0).aborted).toBe(true);

    await actAndFlush(() => response.resolve([{ title: "late", done: false }]));

    expect(screen.getByTestId("todos").textContent).toBe("a,b");
  });

  it("stay alive while another component still uses them", async () => {
    api.loadTodos.mockReturnValue(deferred<Todo[]>().promise);
    function App({ showSecond }: { showSecond: boolean }) {
      return (
        <>
          <TodoList userId="u1" testId="first" />
          {showSecond && <TodoList userId="u1" testId="second" />}
        </>
      );
    }
    const { rerender } = renderWithStore(<App showSecond />);

    rerender(<App showSecond={false} />);
    await flushQueryTeardown();

    expect(signalOfCall(0).aborted).toBe(false);
  });

  it("abort the previous request and start a new one when args change", async () => {
    const firstResponse = deferred<Todo[]>();
    api.loadTodos.mockReturnValueOnce(firstResponse.promise).mockResolvedValueOnce([{ title: "u2 todo", done: false }]);
    const { rerender } = renderWithStore(
      <>
        <TodoList userId="u1" />
        <TodosProbe />
      </>,
    );

    rerender(
      <>
        <TodoList userId="u2" />
        <TodosProbe />
      </>,
    );
    await flushQueryTeardown();
    // the stale u1 response arrives after u2's
    await actAndFlush(() => firstResponse.resolve([{ title: "u1 todo", done: false }]));

    expect(api.loadTodos.mock.calls.map(([userId]) => userId)).toEqual(["u1", "u2"]);
    expect(signalOfCall(0).aborted).toBe(true);
    expect(signalOfCall(1).aborted).toBe(false);
    expect(screen.getByTestId("todos").textContent).toBe("u2 todo");
  });

  it("send a single request under StrictMode's double mount", async () => {
    api.loadTodos.mockResolvedValue([]);
    render(
      <StrictMode>
        <TodoStore.StoreProvider initialValue={initialState}>
          <TodoList userId="u1" />
        </TodoStore.StoreProvider>
      </StrictMode>,
    );
    await flushQueryTeardown();

    expect(api.loadTodos).toHaveBeenCalledTimes(1);
    expect(signalOfCall(0).aborted).toBe(false);
    expect(screen.getByTestId("list").textContent).toBe("success");
  });

  it("fetch again when remounted after being torn down", async () => {
    api.loadTodos.mockResolvedValue([]);
    function App({ showList }: { showList: boolean }) {
      return showList ? <TodoList userId="u1" /> : null;
    }
    const { rerender } = renderWithStore(<App showList />);
    await actAndFlush();

    rerender(<App showList={false} />);
    await flushQueryTeardown();
    rerender(<App showList />);
    await actAndFlush();

    expect(api.loadTodos).toHaveBeenCalledTimes(2);
  });
});
