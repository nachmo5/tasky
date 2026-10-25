import { HomePage } from "../components/pages/HomePage";
import { LoginPage } from "../components/pages/LoginPage";

export const routes = {
  "/": {
    component: HomePage,
    isPublic: false,
  },
  "/login": {
    component: LoginPage,
    isPublic: true,
  },
} as const satisfies Record<string, { component: React.FunctionComponent; isPublic: boolean }>;
