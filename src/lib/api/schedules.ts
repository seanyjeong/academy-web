import apiClient from "./client";

export const schedulesAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/schedules", { params }),
  get: (id: number) => apiClient.get(`/schedules/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/schedules", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/schedules/${id}`, data),
  delete: (id: number) => apiClient.delete(`/schedules/${id}`),
  attendance: (id: number, date?: string) => apiClient.get(`/schedules/${id}/attendance`, { params: { date } }),
  markAttendance: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`/schedules/${id}/attendance`, data),
};
