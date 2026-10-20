import type { TaskOccurrenceDTO } from "@repo/dtos";

export function TaskOccurrenceList(props: { taskOccurrences: TaskOccurrenceDTO[] }) {
  return (
    <ul>
      {props.taskOccurrences.map((taskOccurrence) => (
        <li key={taskOccurrence.id}>{taskOccurrence.template.title}</li>
      ))}
    </ul>
  );
}
