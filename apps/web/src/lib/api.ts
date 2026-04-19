import { env } from "@sports-system/env/web";

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

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, ...rest } = options;

  let url = `${env.VITE_SERVER_URL}${path}`;

  if (params) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null) search.set(k, String(v));
    }
    const qs = search.toString();
    if (qs) url = `${url}?${qs}`;
  }

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!res.ok) {
    let code = "UNKNOWN";
    let detail = res.statusText;
    try {
      const json = await res.json();
      code = json.code ?? code;
      detail = json.detail ?? detail;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, code, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
