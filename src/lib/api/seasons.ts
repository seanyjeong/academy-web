import apiClient from "./client";

export const seasonsAPI = {
  list: () => apiClient.get("/seasons"),
  get: (id: number) => apiClient.get(`/seasons/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/seasons", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/seasons/${id}`, data),
  delete: (id: number) => apiClient.delete(`/seasons/${id}`),
  students: (id: number) => apiClient.get(`/seasons/${id}/students`),
  enroll: (id: number, data: Record<string, unknown>) => apiClient.post(`/seasons/${id}/enroll`, data),
  bulkEnroll: (id: number, data: Record<string, unknown>) => apiClient.post(`/seasons/${id}/bulk-enroll`, data),
  removeStudent: (seasonId: number, studentId: number) => apiClient.delete(`/seasons/${seasonId}/students/${studentId}`),
};
