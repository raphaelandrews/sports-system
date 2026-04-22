import type { Session } from "@/types/auth";

export interface UserSearchResponse {
  id: number;
  email: string;
  name: string;
  role: Session["role"];
  is_active: boolean;
}
