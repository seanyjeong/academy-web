import apiClient from "./client";

export const schedulesAPI = {
  list: (params?: Record<string, unknown>) => apiClient.get("/schedules", { params }),
  get: (id: number) => apiClient.get(`/schedules/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/schedules", data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/schedules/${id}`, data),
  delete: (id: number) => apiClient.delete(`/schedules/${id}`),
  // Attendance
  attendance: (id: number, date?: string) =>
    apiClient.get(`/schedules/${id}/attendance`, { params: { date } }),
  markAttendance: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`/schedules/${id}/attendance`, data),
  // Slot
  slot: (date: string, instructorId?: number) =>
    apiClient.get("/schedules/slot", { params: { date, instructor_id: instructorId } }),
  // Stats
  stats: (yearMonth: string) =>
    apiClient.get("/schedules/stats", { params: { year_month: yearMonth } }),
  // Instructor schedule for month
  instructorMonth: (yearMonth: string) =>
    apiClient.get("/schedules/instructor-schedules/month", { params: { year_month: yearMonth } }),
  // Instructor attendance by date
  instructorAttendanceByDate: (date: string) =>
    apiClient.get(`/schedules/date/${date}/instructor-attendance`),
  markInstructorAttendance: (date: string, data: Record<string, unknown>) =>
    apiClient.post(`/schedules/date/${date}/instructor-attendance`, data),
  // Monthly helper
  monthly: (params?: Record<string, unknown>) => apiClient.get("/schedules", { params }),
};
