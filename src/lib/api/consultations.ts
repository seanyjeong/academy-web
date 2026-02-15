import apiClient from "./client";

export const consultationsAPI = {
  list: (params?: any) => apiClient.get("/consultations", { params }),
  get: (id: number) => apiClient.get(`/consultations/${id}`),
  create: (data: any) => apiClient.post("/consultations", data),
  update: (id: number, data: any) => apiClient.put(`/consultations/${id}`, data),
  conduct: (id: number, data: any) => apiClient.post(`/consultations/${id}/conduct`, data),
  calendar: (params?: any) => apiClient.get("/consultations/calendar", { params }),
  enrolled: (params?: any) => apiClient.get("/consultations/enrolled", { params }),
  settings: () => apiClient.get("/consultations/settings"),
  updateSettings: (data: any) => apiClient.put("/consultations/settings", data),
  publicForm: (slug: string) => apiClient.get(`/consultations/public/${slug}`),
  publicSubmit: (slug: string, data: any) => apiClient.post(`/consultations/public/${slug}`, data),
  reservation: (id: string) => apiClient.get(`/consultations/reservation/${id}`),
};
