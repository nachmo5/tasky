import { ENV } from "./env.lib";

export async function sendRequest<TResponse>(
  path: string,
  options?: {
    body?: unknown;
    queryString?: Record<string, string>;
    responseType?: "text" | "json";
    method?: "POST" | "GET" | "DELETE" | "PUT" | "PATCH";
    signal?: AbortSignal;
  },
) {
  const { body, queryString, responseType = "json", method = "GET", signal } = options ?? {};
  const hasBody = body !== undefined;
  const response = await fetch(buildUrl(path, queryString), {
    method,
    signal,
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return (responseType === "json" ? response.json() : response.text()) as Promise<TResponse>;
}

// Encodes every key and value, e.g. { timeZone: "Etc/GMT+5" } → "?timeZone=Etc%2FGMT%2B5"
function buildUrl(path: string, queryString?: Record<string, string>) {
  const encodedQueryString = new URLSearchParams(queryString).toString();
  return ENV.API_URL + path + (encodedQueryString ? `?${encodedQueryString}` : "");
}
