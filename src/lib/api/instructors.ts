import apiClient from "./client";

export const instructorsAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/instructors", { params }),
  get: (id: number) => apiClient.get(`/instructors/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/instructors", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/instructors/${id}`, data),
  delete: (id: number) => apiClient.delete(`/instructors/${id}`),
  // Available instructors for a date/slot
  available: (date: string, timeSlot: string) =>
    apiClient.get("/instructors/available", { params: { date, time_slot: timeSlot } }),
  // Instructor attendance for a month
  attendance: (id: number, yearMonth: string) =>
    apiClient.get(`/instructors/${id}/attendance`, { params: { year_month: yearMonth } }),
  markAttendance: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`/instructors/${id}/attendance`, data),
  // Overtime
  overtime: (id: number, yearMonth?: string) =>
    apiClient.get(`/instructors/${id}/overtime`, { params: { year_month: yearMonth } }),
  createOvertime: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`/instructors/${id}/overtime`, data),
  pendingOvertimes: () => apiClient.get("/instructors/overtime/pending"),
  approveOvertime: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/instructors/overtime/${id}/approve`, data),
};
