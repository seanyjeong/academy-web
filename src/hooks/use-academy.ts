"use client";

import { create } from "zustand";
import apiClient from "@/lib/api/client";

interface Branch {
  id: number;
  name: string;
}

interface AcademyState {
  branches: Branch[];
  activeBranchId: number | null;
  isMultiBranch: boolean;
  setBranches: (branches: Branch[]) => void;
  switchBranch: (branchId: number | null) => void;
  fetchBranches: () => Promise<void>;
}

export const useAcademy = create<AcademyState>((set) => ({
  branches: [],
  activeBranchId: null,
  isMultiBranch: false,

  setBranches: (branches) =>
    set({ branches, isMultiBranch: branches.length > 1 }),

  switchBranch: (branchId) => {
    if (branchId) {
      localStorage.setItem("activeAcademyId", String(branchId));
    } else {
      localStorage.setItem("activeAcademyId", "all");
    }
    set({ activeBranchId: branchId });
    window.location.reload();
  },

  fetchBranches: async () => {
    try {
      const { data } = await apiClient.get("/academies/branches");
      set({
        branches: data,
        isMultiBranch: data.length > 1,
        activeBranchId: data[0]?.id ?? null,
      });
    } catch {
      // Single branch fallback
    }
  },
}));
