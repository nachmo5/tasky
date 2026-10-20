import { TaskTemplatesEditPage } from "@/components/pages/TaskTemplatesEditPage";
import { LoginPage } from "../components/pages/LoginPage";
import { HomePage } from "@/components/pages/HomePage";

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
} as const satisfies Record<string, { Component: React.FunctionComponent; isPublic: boolean }>;
