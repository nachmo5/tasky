import type { Task } from "@repo/dtos";

export function TaskList(props: { tasks: Task[] }) {
  return (
    <ul>
      {props.tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
