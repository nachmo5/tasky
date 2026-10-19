import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actAndFlush, api, deferred, renderWithStore, TodoStore, TodosProbe } from "./testing/fixtures";

function AddTodo({ onError = () => {} }: { onError?: (error: unknown) => void }) {
  const { addTodo } = TodoStore.useMutations(["addTodo"]);
  return (
    <button onClick={() => void addTodo("new").catch(onError)}>
      {`${addTodo.status}${addTodo.error ? `:${addTodo.error.message}` : ""}`}
    </button>
  );
}

beforeEach(() => {
  api.saveTodo.mockReset();
});

describe("mutations", () => {
  it("start idle and only run when called", () => {
    renderWithStore(<AddTodo />);

    expect(screen.getByRole("button").textContent).toBe("idle");
    expect(api.saveTodo).not.toHaveBeenCalled();
  });

  it("report loading then success, and apply their setters", async () => {
    const response = deferred<void>();
    api.saveTodo.mockReturnValue(response.promise);
    renderWithStore(
      <>
        <AddTodo />
        <TodosProbe />
      </>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("loading");
    expect(api.saveTodo).toHaveBeenCalledWith("new");

    await actAndFlush(() => response.resolve());

    expect(screen.getByRole("button").textContent).toBe("success");
    expect(screen.getByTestId("todos").textContent).toBe("a,b,new");
  });

  it("report an error status and reject the call with the error", async () => {
    const error = new Error("save failed");
    api.saveTodo.mockRejectedValue(error);
    const onError = vi.fn();
    renderWithStore(
      <>
        <AddTodo onError={onError} />
        <TodosProbe />
      </>,
    );

    fireEvent.click(screen.getByRole("button"));
    await actAndFlush();

    expect(screen.getByRole("button").textContent).toBe("error:save failed");
    expect(onError).toHaveBeenCalledWith(error);
    expect(screen.getByTestId("todos").textContent).toBe("a,b");
  });

  it("keep the status of the latest call when an older call settles later", async () => {
    const firstCall = deferred<void>();
    const secondCall = deferred<void>();
    api.saveTodo.mockReturnValueOnce(firstCall.promise).mockReturnValueOnce(secondCall.promise);
    renderWithStore(<AddTodo />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    await actAndFlush(() => secondCall.resolve());
    await actAndFlush(() => firstCall.reject(new Error("first call failed")));

    expect(screen.getByRole("button").textContent).toBe("success");
  });

  it("still apply their setters when the component unmounts before they finish", async () => {
    const response = deferred<void>();
    api.saveTodo.mockReturnValue(response.promise);
    function App({ showForm }: { showForm: boolean }) {
      return (
        <>
          {showForm && <AddTodo />}
          <TodosProbe />
        </>
      );
    }
    const { rerender } = renderWithStore(<App showForm />);

    fireEvent.click(screen.getByRole("button"));
    rerender(<App showForm={false} />);
    await actAndFlush(() => response.resolve());

    expect(screen.getByTestId("todos").textContent).toBe("a,b,new");
  });
});
