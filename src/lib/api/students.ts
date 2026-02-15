import apiClient from "./client";

export const studentsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/students", { params }),
  get: (id: number) => apiClient.get(`/students/${id}`),
};
