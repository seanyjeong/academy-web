import apiClient from "./client";

export const seasonsAPI = {
  list: () => apiClient.get("/seasons"),
  get: (id: number) => apiClient.get(`/seasons/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/seasons", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/seasons/${id}`, data),
  delete: (id: number) => apiClient.delete(`/seasons/${id}`),
  enroll: (id: number, data: Record<string, unknown>) => apiClient.post(`/seasons/${id}/enroll`, data),
};
