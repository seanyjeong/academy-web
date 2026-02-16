import apiClient from "./client";

export const consultationsAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/consultations", { params }),
  get: (id: number) => apiClient.get(`/consultations/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/consultations", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/consultations/${id}`, data),
  delete: (id: number) => apiClient.delete(`/consultations/${id}`),
  conduct: (id: number, data: Record<string, unknown>) => apiClient.post(`/consultations/${id}/conduct`, data),
  convert: (id: number) => apiClient.post(`/consultations/${id}/convert`),
  linkStudent: (id: number, data: Record<string, unknown>) => apiClient.post(`/consultations/${id}/link-student`, data),
  calendar: (params?: Record<string, unknown>) => apiClient.get("/consultations/calendar", { params }),
  enrolled: (params?: Record<string, unknown>) => apiClient.get("/consultations/enrolled", { params }),
  settings: () => apiClient.get("/consultations/settings"),
  updateSettings: (data: Record<string, unknown>) => apiClient.put("/consultations/settings", data),
  checkSlug: (slug: string) => apiClient.get(`/consultations/check-slug/${slug}`),
  publicForm: (slug: string) => apiClient.get(`/consultations/public/${slug}`),
  publicSubmit: (slug: string, data: Record<string, unknown>) => apiClient.post(`/consultations/public/${slug}`, data),
  reservation: (id: string) => apiClient.get(`/consultations/reservation/${id}`),
};
