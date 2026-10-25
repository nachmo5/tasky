import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreLoader } from "./boundary";
import { actAndFlush, api, buildDeferred, renderWithStore, TodoStore, type Todo } from "./testing/fixtures";

beforeEach(() => {
  api.loadTodos.mockReset();
  api.saveTodo.mockReset();
});

describe("StoreConsumer", () => {
  it("passes getters, setters, query statuses and mutations to its children", () => {
    api.loadTodos.mockReturnValue(buildDeferred<Todo[]>().promise);
    renderWithStore(
      <TodoStore.StoreConsumer
        getters={["remaining"]}
        queries={[{ name: "loadTodos", args: ["u1"], alias: "todosRequest" }]}
        mutations={["addTodo"]}
      >
        {({ remaining, todosRequest, addTodo, pushTodo }) => (
          <p data-testid="props">{`${remaining}|${todosRequest.status}|${addTodo.status}|${typeof pushTodo}`}</p>
        )}
      </TodoStore.StoreConsumer>,
    );

    expect(screen.getByTestId("props").textContent).toBe("1|loading|idle|function");
  });

  it("shows the loader instead of its children while a query is loading", async () => {
    const response = buildDeferred<Todo[]>();
    api.loadTodos.mockReturnValue(response.promise);
    const renderChildren = vi.fn(({ todos }: { todos: Todo[] }) => <p>{`${todos.length} todos`}</p>);
    renderWithStore(
      <TodoStore.StoreConsumer
        getters={["todos"]}
        queries={[{ name: "loadTodos", args: ["u1"] }]}
        loader={<p>loading…</p>}
      >
        {renderChildren}
      </TodoStore.StoreConsumer>,
    );

    expect(screen.getByText("loading…")).toBeDefined();
    expect(renderChildren).not.toHaveBeenCalled();

    await actAndFlush(() => response.resolve([{ title: "x", isDone: false }]));

    expect(screen.queryByText("loading…")).toBeNull();
    expect(screen.getByText("1 todos")).toBeDefined();
  });

  it("keeps showing its children while a mutation is running", () => {
    api.saveTodo.mockReturnValue(buildDeferred<void>().promise);
    renderWithStore(
      <TodoStore.StoreConsumer mutations={["addTodo"]} loader={<p>loading…</p>}>
        {({ addTodo }) => <button onClick={() => void addTodo("new")}>{addTodo.status}</button>}
      </TodoStore.StoreConsumer>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button").textContent).toBe("loading");
    expect(screen.queryByText("loading…")).toBeNull();
  });
});

describe("StoreLoader", () => {
  it("renders the loader while any request is loading", () => {
    render(
      <StoreLoader statuses={["success", "loading"]} loader={<p>loading…</p>}>
        {() => <p>content</p>}
      </StoreLoader>,
    );

    expect(screen.getByText("loading…")).toBeDefined();
  });

  it("renders the children when there is no request at all", () => {
    render(
      <StoreLoader statuses={[]} loader={<p>loading…</p>}>
        {() => <p>content</p>}
      </StoreLoader>,
    );

    expect(screen.getByText("content")).toBeDefined();
  });
});
