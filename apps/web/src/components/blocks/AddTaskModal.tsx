import { Button } from "../base/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../base/dialog";
import { Input } from "../base/input";

export function AddTaskModal(props: {
  isOpen: boolean;
  isSaving: boolean;
  saveError?: string;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (title: string) => void;
}) {
  return (
    <Dialog open={props.isOpen} onOpenChange={(isOpen) => props.onOpenChange(isOpen)}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const title = new FormData(e.currentTarget).get("title");
            if (typeof title === "string" && title.trim() !== "") props.onSave(title.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <Input name="title" aria-label="Title" placeholder="What needs to be done?" autoFocus required />
          {props.saveError && (
            <p role="alert" className="text-sm text-destructive">
              {props.saveError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={props.isSaving}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
