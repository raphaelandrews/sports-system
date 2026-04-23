import { env } from "@sports-system/env/web";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePath(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

export function buildApiUrl(path: string) {
  return `${normalizeBaseUrl(env.VITE_SERVER_URL)}${normalizePath(path)}`;
}
