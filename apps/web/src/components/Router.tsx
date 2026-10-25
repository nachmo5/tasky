import { useEffect } from "react";
import { routes } from "../config/routes";
import { useGlobalGetters, useGlobalQueries } from "../config/store";
import { NotFoundPage } from "./pages/NotFoundPage";
import { redirect } from "@/lib/routes.lib";

export function Router() {
  const routePath = window.location.pathname as keyof typeof routes;
  const currentRoute = routes[routePath];
  const { fetchMe } = useGlobalQueries(["fetchMe"]);
  const { user } = useGlobalGetters(["user"]);

  useEffect(() => {
    if (currentRoute && !currentRoute.isPublic && fetchMe.status === "success" && !user) {
      redirect("/login");
    }
  }, [currentRoute, fetchMe.status, user]);

  if (!currentRoute) {
    return <NotFoundPage />;
  }

  if (currentRoute.isPublic) {
    return <currentRoute.component />;
  }

  if (fetchMe.status === "idle" || fetchMe.status === "loading") {
    return <>Loading...</>;
  }

  if (fetchMe.status === "error") {
    return <>Failed to load user. Please try again.</>;
  }

  if (!user) {
    return <>Redirecting...</>;
  }

  return <currentRoute.component />;
}
