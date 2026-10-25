import { LOCAL_STORAGE_KEYS } from "@/config/localStorage";
import type { TaskTemplateDTO } from "@repo/dtos";
import { TaskTemplateTable } from "../blocks/TaskTemplateTable";

export function OfflinePage() {
  const str = localStorage.getItem(LOCAL_STORAGE_KEYS["BACKUP"]);
  const backupData = safeParseJson(str ?? "") as { version: string; data: TaskTemplateDTO[] } | null;

  if (!backupData) {
    return <div>No Backup</div>;
  }

  return (
    <div>
      <TaskTemplateTable taskTemplates={backupData.data} changesById={{}} onChange={() => {}} />
    </div>
  );
}

function safeParseJson(json: string): Record<string, unknown> | null {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch (_e) {
    return null;
  }
}
