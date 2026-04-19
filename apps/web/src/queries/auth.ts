import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export interface Session {
  id: number;
  email: string;
  name: string;
  role: "admin" | "chief" | "athlete" | "coach";
}

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.auth.session(),
    queryFn: () => apiFetch<Session>("/users/me"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
