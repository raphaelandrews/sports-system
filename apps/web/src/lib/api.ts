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

  let authHeader: Record<string, string> = {};
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("access_token="));
    if (match) {
      authHeader = { Authorization: `Bearer ${match.split("=")[1]}` };
    }
  }

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...authHeader,
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
      const raw = json.detail ?? detail;
      detail = typeof raw === "string" ? raw : JSON.stringify(raw);
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, code, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
