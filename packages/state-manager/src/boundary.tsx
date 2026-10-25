import { type RequestStatus } from "./types";

export function StoreLoader(props: {
  statuses: RequestStatus[];
  loader: React.ReactNode;
  // A render function instead of an element, so the children are only rendered
  // once nothing is loading (previously they ran even while the loader was shown).
  children: () => React.ReactNode;
}) {
  // `some` instead of `every`: show the loader while any request is loading. With `every`,
  // one idle mutation hid the loader, and an empty list (`[].every` is true) showed it forever.
  const isLoading = props.statuses.some((status) => status === "loading");

  if (isLoading) {
    return props.loader;
  }
  return props.children();
}
