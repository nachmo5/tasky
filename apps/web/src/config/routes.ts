import { TaskTemplatesEditPage } from "@/components/pages/TaskTemplatesEditPage";
import { LoginPage } from "../components/pages/LoginPage";
import { HomePage } from "@/components/pages/HomePage";
import { CalendarPage } from "@/components/pages/CalendarPage";
import { OfflinePage } from "@/components/pages/OfflinePage";

export const routes = {
  "/": {
    Component: HomePage,
    isPublic: false,
  },
  "/login": {
    Component: LoginPage,
    isPublic: true,
  },
  "/task-templates": {
    Component: TaskTemplatesEditPage,
    isPublic: false,
  },
  "/calendar": {
    Component: CalendarPage,
    isPublic: false,
  },
  "/offline": {
    Component: OfflinePage,
    isPublic: true,
  },
} as const satisfies Record<string, { Component: React.FunctionComponent; isPublic: boolean }>;

export function getRoute(path: keyof typeof routes) {
  return path;
}
