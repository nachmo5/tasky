import { Plus } from "lucide-react";
import { Button } from "../base/button";

export function AddTaskButton(props: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      aria-label="Add task"
      className="sticky bottom-4 mt-auto size-12.5 self-end rounded-full shadow-lg"
      onClick={props.onClick}
    >
      <Plus className="size-6" />
    </Button>
  );
}
