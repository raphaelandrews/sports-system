import { buildApiUrl } from "@/lib/url";

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

type LeagueSummary = {
  id: number;
  is_showcase?: boolean;
};

const LEGACY_LEAGUE_SCOPED_PREFIXES = [
  "/competitions",
  "/delegations",
  "/athletes",
  "/events",
  "/enrollments",
  "/results",
  "/report",
  "/narrative",
  "/ai/generation-history",
  "/search",
  "/activities",
  "/admin",
] as const;

let defaultLeagueIdPromise: Promise<number | null> | null = null;

function isLeagueScopedLegacyPath(path: string) {
  return LEGACY_LEAGUE_SCOPED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

async function getDefaultLeagueId(): Promise<number | null> {
  if (defaultLeagueIdPromise) return defaultLeagueIdPromise;

  defaultLeagueIdPromise = (async () => {
    const res = await fetch(buildApiUrl("/leagues"), {
      credentials: "include",
    });
    if (!res.ok) return null;

    const leagues = (await res.json()) as LeagueSummary[];
    if (!Array.isArray(leagues) || leagues.length === 0) return null;

    return leagues.find((league) => league.is_showcase)?.id ?? leagues[0]?.id ?? null;
  })();

  return defaultLeagueIdPromise;
}

async function resolveApiPath(path: string): Promise<string> {
  if (!isLeagueScopedLegacyPath(path) || path.startsWith("/leagues/")) {
    return path;
  }

  const leagueId = await getDefaultLeagueId();
  if (leagueId == null) {
    return path;
  }

  return `/leagues/${leagueId}${path}`;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options;

  const resolvedPath = await resolveApiPath(path);
  let url = buildApiUrl(resolvedPath);

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
    const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
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

export async function apiFetchBlob(path: string): Promise<Blob> {
  const resolvedPath = await resolveApiPath(path);
  let authHeader: Record<string, string> = {};
  if (typeof document !== "undefined") {
    const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    if (match) {
      authHeader = { Authorization: `Bearer ${match.split("=")[1]}` };
    }
  }

  const res = await fetch(buildApiUrl(resolvedPath), {
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
