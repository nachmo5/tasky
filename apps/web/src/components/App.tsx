import { routes } from "@/config/routes";
import { useGlobalQueries, useGlobalGetters, GlobalProvider, globalStoreInitialValue } from "@/config/store";
import { objectEntries } from "@repo/lib";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from "react-router";
import { NotFoundPage } from "./pages/NotFoundPage";
import { buttonVariants } from "@/lib/css.lib";

export function App() {
  return (
    <BrowserRouter>
      <GlobalProvider initialValue={globalStoreInitialValue}>
        <div className="flex gap-4 p-4">
          {objectEntries(routes).map(([path]) => (
            <Link to={path} key={path} className={buttonVariants({ variant: "default" })}>
              {path.slice(1) || "Home"}
            </Link>
          ))}
        </div>
        <Router />
      </GlobalProvider>
    </BrowserRouter>
  );
}

function Router() {
  return (
    <Routes>
      {objectEntries(routes)
        .filter(([_, route]) => route.isPublic)
        .map(([path, route]) => (
          <Route key={path} path={path} element={<route.Component />} />
        ))}

      <Route element={<PrivateRoutesContainer />}>
        {objectEntries(routes)
          .filter(([_, route]) => !route.isPublic)
          .map(([path, route]) => (
            <Route key={path} path={path} element={<route.Component />} />
          ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function PrivateRoutesContainer() {
  const { fetchMe } = useGlobalQueries(["fetchMe"]);
  const { user } = useGlobalGetters(["user"]);

  if (fetchMe.status === "idle" || fetchMe.status === "loading") {
    return <>Loading...</>;
  }

  if (fetchMe.status === "error") {
    return <>Failed to load user. Please try again.</>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
