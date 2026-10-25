import { GlobalProvider, globalStoreInitialValue } from "../config/store";
import { Router } from "./Router";

export function App() {
  return (
    <GlobalProvider initialValue={globalStoreInitialValue}>
      <Router />
    </GlobalProvider>
  );
}
