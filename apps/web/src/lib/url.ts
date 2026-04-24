import { env } from "@sports-system/env/web";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePath(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

function resolveDevApiBaseUrl(value: string) {
  const normalized = normalizeBaseUrl(value);

  if (!import.meta.env.DEV) {
    return normalized;
  }

  try {
    const hostname = new URL(normalized).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return normalized;
    }
  } catch {
    return normalized;
  }

  return "http://localhost:3000";
}

export function buildApiUrl(path: string) {
  return `${resolveDevApiBaseUrl(env.VITE_SERVER_URL)}${normalizePath(path)}`;
}
