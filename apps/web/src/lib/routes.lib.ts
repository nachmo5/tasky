import type { routes } from "@/config/routes";

export function redirect(path: keyof typeof routes) {
  window.location.href = path;
}
