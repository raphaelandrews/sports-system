import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

import type {
  LoginRequest,
  RegisterRequest,
  Session,
  TokenResponse,
} from "@/types/auth";

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string;

function setAuthCookies(tokens: TokenResponse) {
  setCookie("access_token", tokens.access_token, {
    httpOnly: false,
    maxAge: 1800,
    sameSite: "lax",
    path: "/",
  });
  setCookie("refresh_token", tokens.refresh_token, {
    httpOnly: true,
    maxAge: 604800,
    sameSite: "lax",
    path: "/",
  });
}

export const getSessionFn = createServerFn().handler(
  async (): Promise<Session | null> => {
    const token = getCookie("access_token");
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json() as Promise<Session>;
    } catch {
      return null;
    }
  },
);

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: LoginRequest) => data)
  .handler(async ({ data }) => {
    const res = await fetch(`${SERVER_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const detail = (json as { detail?: string }).detail ?? "Login failed";
      throw new Error(detail);
    }
    const tokens = (await res.json()) as TokenResponse;
    setAuthCookies(tokens);
    return tokens;
  });

export const registerFn = createServerFn({ method: "POST" })
  .inputValidator((data: RegisterRequest) => data)
  .handler(async ({ data }) => {
    const res = await fetch(`${SERVER_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const detail =
        (json as { detail?: string }).detail ?? "Registration failed";
      throw new Error(detail);
    }
    const tokens = (await res.json()) as TokenResponse;
    setAuthCookies(tokens);
    return tokens;
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const refreshToken = getCookie("refresh_token");
  if (refreshToken) {
    await fetch(`${SERVER_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }
  deleteCookie("access_token");
  deleteCookie("refresh_token");
});

export const finalizeOAuthFn = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const res = await fetch(`${SERVER_URL}/auth/oauth/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const detail =
        (json as { detail?: string }).detail ?? "OAuth login failed";
      throw new Error(detail);
    }
    const tokens = (await res.json()) as TokenResponse;
    setAuthCookies(tokens);
    return tokens;
  });
