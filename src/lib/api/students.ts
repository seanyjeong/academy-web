import apiClient from "./client";
import { Student } from "@/lib/types/student";

// --- State transition types ---

interface ProcessRestData {
  rest_start_date: string;
  rest_end_date: string;
  rest_reason?: string;
}

interface WithdrawData {
  reason?: string;
}

interface ManualCreditData {
  days: number;
  reason: string;
}

export const studentsAPI = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get("/students", { params }),
  get: (id: number) => apiClient.get(`/students/${id}`),
  create: (data: Partial<Student>) => apiClient.post("/students", data),
  update: (id: number, data: Partial<Student>) => apiClient.put(`/students/${id}`, data),
  delete: (id: number) => apiClient.delete(`/students/${id}`),
  classDays: (params?: { student_id?: number }) => apiClient.get("/students/class-days", { params }),
  updateClassDays: (studentId: number, data: Record<string, unknown>) =>
    apiClient.put(`/students/${studentId}/class-days`, data),
  settings: () => apiClient.get("/settings"),

  // State transitions
  processRest: (id: number, data: ProcessRestData) =>
    apiClient.post(`/students/${id}/process-rest`, data),
  resume: (id: number) =>
    apiClient.post(`/students/${id}/resume`),
  withdraw: (id: number, data?: WithdrawData) =>
    apiClient.post(`/students/${id}/withdraw`, data ?? {}),
  restEnded: () =>
    apiClient.get("/students/rest-ended"),

  // Credits
  restCredits: (id: number, year?: number) =>
    apiClient.get(`/students/${id}/rest-credits`, { params: year ? { year } : {} }),
  credits: (id: number) =>
    apiClient.get(`/students/${id}/credits`),
  addCredits: (id: number, data: { credits: number; reason?: string }) =>
    apiClient.post(`/students/${id}/rest-credits`, data),
  applyCredit: (id: number, creditId: number) =>
    apiClient.post(`/students/${id}/credits/${creditId}/apply`),
  updateCredit: (id: number, creditId: number, data: { credits?: number; reason?: string; year?: number }) =>
    apiClient.put(`/students/${id}/credits/${creditId}`, data),
  deleteCredit: (id: number, creditId: number) =>
    apiClient.delete(`/students/${id}/credits/${creditId}`),
  manualCredit: (id: number, data: ManualCreditData) =>
    apiClient.post(`/students/${id}/manual-credit`, data),

  // Auto promote
  autoPromote: (data: { dry_run?: boolean }) =>
    apiClient.post("/students/auto-promote", data),
};
