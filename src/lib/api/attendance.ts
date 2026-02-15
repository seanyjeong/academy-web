import apiClient from "./client";

export const attendanceAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/attendance", { params }),
  byStudent: (studentId: number, params?: Record<string, unknown>) =>
    apiClient.get(`/attendance/students/${studentId}`, { params }),
  summary: (params?: Record<string, unknown>) => apiClient.get("/attendance/summary", { params }),
  mark: (data: Record<string, unknown>) => apiClient.post("/attendance", data),
};
