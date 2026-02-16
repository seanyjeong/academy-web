import apiClient from "./client";
import { Student } from "@/lib/types/student";

export const studentsAPI = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get("/students", { params }),
  get: (id: number) => apiClient.get(`/students/${id}`),
  create: (data: Partial<Student>) => apiClient.post("/students", data),
  update: (id: number, data: Partial<Student>) => apiClient.put(`/students/${id}`, data),
  delete: (id: number) => apiClient.delete(`/students/${id}`),
  classDays: (params?: { student_id?: number }) => apiClient.get("/students/class-days", { params }),
  updateClassDays: (studentId: number, data: Record<string, unknown>) =>
    apiClient.put(`/students/${studentId}/class-days`, data),
  settings: () => apiClient.get("/settings"),
};
