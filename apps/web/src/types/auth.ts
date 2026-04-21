export interface Session {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "CHIEF" | "ATHLETE" | "COACH";
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface ChiefRequestCreate {
  delegation_name: string;
  message?: string;
}

export interface ChiefRequestResponse {
  id: number;
  user_id: number;
  delegation_name: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewed_by: number | null;
  created_at: string;
}
