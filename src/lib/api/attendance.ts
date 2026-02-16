import apiClient from "./client";

export const attendanceAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/attendance", { params }),
  byStudent: (studentId: number, params?: Record<string, unknown>) =>
    apiClient.get(`/attendance/student/${studentId}`, { params }),
  byDate: (params?: Record<string, unknown>) => apiClient.get("/attendance/daily", { params }),
  summary: (params?: Record<string, unknown>) => apiClient.get("/attendance/summary", { params }),
  mark: (data: Record<string, unknown>) => apiClient.post("/attendance", data),
  batch: (data: Record<string, unknown>) => apiClient.post("/attendance", data),
  monthlySummary: (year: number, month: number) =>
    apiClient.get("/attendance/monthly/summary", { params: { year, month } }),
  monthly: (year: number, month: number) =>
    apiClient.get("/attendance/monthly", { params: { year, month } }),
};
