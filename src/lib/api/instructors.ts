import apiClient from "./client";

export const instructorsAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/instructors", { params }),
  get: (id: number) => apiClient.get(`/instructors/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/instructors", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/instructors/${id}`, data),
  delete: (id: number) => apiClient.delete(`/instructors/${id}`),
};
