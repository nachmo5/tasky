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
): Promise<TResponse> {
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
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  // Handle endpoints that return no content.
  if (response.status === 204 || response.status === 205) {
    return undefined as TResponse;
  }

  if (responseType === "text") {
    return (await response.text()) as TResponse;
  }

  const text = await response.text();

  // Handle an empty response body.
  if (!text.trim()) {
    return undefined as TResponse;
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new Error(`Expected a JSON response from ${path}, but received invalid JSON.`);
  }
}

// Encodes every key and value, e.g. { timeZone: "Etc/GMT+5" } → "?timeZone=Etc%2FGMT%2B5"
function buildUrl(path: string, queryString?: Record<string, string>) {
  const encodedQueryString = new URLSearchParams(queryString).toString();
  return ENV.API_URL + path + (encodedQueryString ? `?${encodedQueryString}` : "");
}
