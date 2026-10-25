import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStore } from "./index";
import { renderWithStore, TodoStore, TodosProbe, type Todo } from "./testing/fixtures";

function Actions() {
  const { renameTodo, toggleTodo, pushTodo } = TodoStore.useSetters();
  return (
    <>
      <button onClick={() => renameTodo(0, "renamed")}>rename</button>
      <button onClick={() => toggleTodo(0)}>toggle</button>
      <button onClick={() => pushTodo("c")}>push</button>
    </>
  );
}

describe("getters", () => {
  it("returns the getters requested by name", () => {
    function Remaining() {
      const { remaining } = TodoStore.useGetters(["remaining"]);
      return <p data-testid="remaining">{remaining}</p>;
    }
    renderWithStore(<Remaining />);

    expect(screen.getByTestId("remaining").textContent).toBe("1");
  });

  it("passes args to the getter and exposes the result under its alias", () => {
    function Titles() {
      const { first, second } = TodoStore.useGetters([
        { name: "todoTitle", args: [0], alias: "first" },
        { name: "todoTitle", args: [1], alias: "second" },
      ]);
      return <p data-testid="titles">{`${first}-${second}`}</p>;
    }
    renderWithStore(<Titles />);

    expect(screen.getByTestId("titles").textContent).toBe("a-b");
  });

  it("re-renders only when a requested value changes", () => {
    const onRender = vi.fn();
    function Remaining() {
      onRender();
      const { remaining } = TodoStore.useGetters(["remaining"]);
      return <p data-testid="remaining">{remaining}</p>;
    }
    renderWithStore(
      <>
        <Remaining />
        <Actions />
      </>,
    );
    expect(onRender).toHaveBeenCalledTimes(1);

    // the state changes but `remaining` stays 1
    fireEvent.click(screen.getByText("rename"));
    expect(onRender).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("toggle"));
    expect(onRender).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("remaining").textContent).toBe("0");
  });
});

describe("setters", () => {
  it("update the state and re-render consumers", () => {
    renderWithStore(
      <>
        <TodosProbe />
        <Actions />
      </>,
    );

    fireEvent.click(screen.getByText("rename"));
    fireEvent.click(screen.getByText("push"));

    expect(screen.getByTestId("todos").textContent).toBe("renamed,b,c");
  });

  it("produce a new state instead of mutating the previous one", () => {
    const seenTodos: Todo[][] = [];
    function TodosSpy() {
      const { todos } = TodoStore.useGetters(["todos"]);
      seenTodos.push(todos);
      return null;
    }
    renderWithStore(
      <>
        <TodosSpy />
        <Actions />
      </>,
    );

    fireEvent.click(screen.getByText("push"));

    const [before, after] = seenTodos;
    expect(after).not.toBe(before);
    expect(before).toHaveLength(2);
    expect(after).toHaveLength(3);
  });
});

describe("createStore builder", () => {
  type CounterState = { count: number };
  const baseStore = createStore<CounterState>().addGetters({ count: (state) => state.count });
  const extendedStore = baseStore
    .addSetters({
      increment: (state) => {
        state.count += 1;
      },
    })
    .addGetters({ double: (state) => state.count * 2 });

  function Counter({ label }: { label: string }) {
    const { count, double } = extendedStore.useGetters(["count", "double"]);
    const { increment } = extendedStore.useSetters();
    return <button onClick={() => increment()}>{`${label}:${count}-${double}`}</button>;
  }

  it("keeps earlier sections when adding new ones, and shares one context across steps", () => {
    // provider from the first step, consumers from the last one
    render(
      <baseStore.StoreProvider initialValue={{ count: 1 }}>
        <Counter label="counter" />
      </baseStore.StoreProvider>,
    );
    expect(screen.getByRole("button").textContent).toBe("counter:1-2");

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("counter:2-4");
  });

  it("gives each provider its own state", () => {
    render(
      <>
        <extendedStore.StoreProvider initialValue={{ count: 1 }}>
          <Counter label="first" />
        </extendedStore.StoreProvider>
        <extendedStore.StoreProvider initialValue={{ count: 10 }}>
          <Counter label="second" />
        </extendedStore.StoreProvider>
      </>,
    );

    fireEvent.click(screen.getByText("first:1-2"));

    expect(screen.getByText("first:2-4")).toBeDefined();
    expect(screen.getByText("second:10-20")).toBeDefined();
  });
});
