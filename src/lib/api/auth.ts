import apiClient from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    academy_id: number;
    permissions: Record<string, Record<string, boolean>> | null;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  academy_name: string;
}

export const authAPI = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post("/auth/register", data),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/auth/reset-password", { token, password }),

  me: () => apiClient.get<LoginResponse["user"]>("/auth/me"),
};
