import apiClient from "./client";

export interface ConsultationListParams {
  search?: string;
  status?: string;
  consultation_type?: string;
  limit?: number;
  offset?: number;
}

export interface ConsultationCreateData {
  name: string;
  phone?: string;
  consultation_type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
}

export interface ConsultationUpdateData {
  name?: string;
  phone?: string;
  consultation_type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
  status?: string;
}

export interface ConductData {
  result: string;
  notes?: string;
  next_date?: string;
}

export interface LinkStudentData {
  student_id: number;
}

export interface CalendarParams {
  year?: number;
  month?: number;
  year_month?: string;
}

export interface EnrolledParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ConsultationSettingsData {
  slug?: string;
  duration_minutes?: number;
  max_per_slot?: number;
  auto_reply?: boolean;
  is_active?: boolean;
  field_school?: boolean;
  field_grade?: boolean;
  field_sport_interest?: boolean;
  field_preferred_date?: boolean;
  notification_enabled?: boolean;
  notification_type?: string;
  [key: string]: unknown;
}

export interface PublicSubmitData {
  name: string;
  phone: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  school?: string;
  grade?: string;
  sport_interest?: string;
}

export const consultationsAPI = {
  list: (params?: ConsultationListParams) => apiClient.get("/consultations", { params }),
  get: (id: number) => apiClient.get(`/consultations/${id}`),
  create: (data: ConsultationCreateData) => apiClient.post("/consultations", data),
  update: (id: number, data: ConsultationUpdateData) => apiClient.put(`/consultations/${id}`, data),
  delete: (id: number) => apiClient.delete(`/consultations/${id}`),
  conduct: (id: number, data: ConductData) => apiClient.post(`/consultations/${id}/conduct`, data),
  convert: (id: number, data?: { admission_type?: string }) => apiClient.post(`/consultations/${id}/convert`, data),
  linkStudent: (id: number, data: LinkStudentData) => apiClient.post(`/consultations/${id}/link-student`, data),
  calendar: (params?: CalendarParams) => apiClient.get("/consultations/calendar", { params }),
  enrolled: (params?: EnrolledParams) => apiClient.get("/consultations/enrolled", { params }),
  settings: () => apiClient.get("/consultations/settings"),
  updateSettings: (data: ConsultationSettingsData) => apiClient.put("/consultations/settings", data),
  updateWeeklyHours: (data: { weekly_hours: Record<string, string[]> }) =>
    apiClient.put("/consultations/weekly-hours", data),
  addBlockedSlot: (data: { date: string; start_time: string; end_time: string; reason?: string }) =>
    apiClient.post("/consultations/blocked-slots", data),
  removeBlockedSlot: (slotId: number) =>
    apiClient.delete(`/consultations/blocked-slots/${slotId}`),
  checkSlug: (slug: string) => apiClient.get(`/consultations/check-slug/${slug}`),
  publicForm: (slug: string) => apiClient.get(`/consultations/public/${slug}`),
  publicSubmit: (slug: string, data: PublicSubmitData) => apiClient.post(`/consultations/public/${slug}`, data),
  reservation: (id: string) => apiClient.get(`/consultations/reservation/${id}`),
};
