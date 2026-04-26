import createClient from "openapi-fetch";

import type { paths } from "@/types/api.gen";
import { buildApiUrl } from "./url";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const client = createClient<paths>({
  baseUrl: buildApiUrl(""),
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

client.use({
  onRequest({ request }) {
    if (typeof document !== "undefined") {
      const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
      if (match) {
        request.headers.set("Authorization", `Bearer ${match.split("=")[1]}`);
      }
    }
    return request;
  },
  async onResponse({ response }) {
    if (!response.ok) {
      let code = "UNKNOWN";
      let detail = response.statusText;
      try {
        const json = await response.clone().json();
        code = json.code ?? code;
        const raw = json.detail ?? detail;
        detail = typeof raw === "string" ? raw : JSON.stringify(raw);
      } catch {
        // ignore parse error
      }
      throw new ApiError(response.status, code, detail);
    }
    return response;
  },
});

export { client };

/** Typed response data extractor. Throws ApiError on failure. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (error) {
    throw new ApiError(response.status, "UNKNOWN", String(error));
  }
  if (data === undefined) {
    throw new ApiError(response.status, "NO_DATA", "Response contained no data");
  }
  return data;
}

/** Download a blob from an API endpoint. */
export async function unwrapBlob(path: string): Promise<Blob> {
  const url = buildApiUrl(path);
  let authHeader: Record<string, string> = {};
  if (typeof document !== "undefined") {
    const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    if (match) {
      authHeader = { Authorization: `Bearer ${match.split("=")[1]}` };
    }
  }

  const res = await fetch(url, {
    credentials: "include",
    headers: authHeader,
  });

  if (!res.ok) {
    let code = "UNKNOWN";
    let detail = res.statusText;
    try {
      const json = await res.json();
      code = json.code ?? code;
      const raw = json.detail ?? detail;
      detail = typeof raw === "string" ? raw : JSON.stringify(raw);
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, code, detail);
  }

  return res.blob();
}
