import apiClient from "./client";

export const paymentsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/payments", { params }),
  get: (id: number) => apiClient.get(`/payments/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post("/payments", data),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/payments/${id}`, data),
  delete: (id: number) => apiClient.delete(`/payments/${id}`),
  pay: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`/payments/${id}/pay`, data),
  credits: (params?: Record<string, unknown>) =>
    apiClient.get("/payments/credits", { params }),
  unpaid: (params?: Record<string, unknown>) =>
    apiClient.get("/payments/unpaid", { params }),
  bulkMonthly: (data: Record<string, unknown>) =>
    apiClient.post("/payments/bulk-monthly", data),
  prepaidPreview: (data: Record<string, unknown>) =>
    apiClient.post("/payments/prepaid-preview", data),
  prepaidPay: (data: Record<string, unknown>) =>
    apiClient.post("/payments/prepaid-pay", data),
  prepaid: (studentId: number) =>
    apiClient.get(`/payments/prepaid/${studentId}`),
};

export const salariesAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/salaries", { params }),
  get: (id: number) => apiClient.get(`/salaries/${id}`),
  calculate: (data: Record<string, unknown>) =>
    apiClient.post("/salaries/calculate", data),
};

export const incomesAPI = {
  summary: (params?: Record<string, unknown>) =>
    apiClient.get("/incomes/summary", { params }),
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/incomes", { params }),
};

export const expensesAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/expenses", { params }),
  create: (data: Record<string, unknown>) =>
    apiClient.post("/expenses", data),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/expenses/${id}`, data),
  delete: (id: number) => apiClient.delete(`/expenses/${id}`),
  categories: () => apiClient.get("/expenses/categories"),
};
