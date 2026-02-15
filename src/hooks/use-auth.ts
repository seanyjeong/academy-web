"use client";

import { create } from "zustand";
import { User } from "@/lib/types/user";
import { authAPI } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (page: string, action?: string) => boolean;
  hasModule: (module: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("token", data.token);
    if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
    localStorage.setItem("activeAcademyId", String(data.user.academy_id));
    set({ user: data.user as User });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("activeAcademyId");
    set({ user: null });
    window.location.href = "/login";
  },

  fetchMe: async () => {
    try {
      const { data } = await authAPI.me();
      set({ user: data as User, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  hasPermission: (page, action = "view") => {
    const { user } = get();
    if (!user) return false;
    if (user.role === "owner" || user.role === "admin") return true;
    return user.permissions?.[page]?.[action] ?? false;
  },

  hasModule: (module) => {
    const { user } = get();
    if (!user) return false;
    if (module === "core") return true;
    return user.modules?.includes(module) ?? false;
  },
}));
