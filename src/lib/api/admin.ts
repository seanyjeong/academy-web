import apiClient from "./client";

export const reportsAPI = {
  dashboard: (params?: any) => apiClient.get("/reports/dashboard", { params }),
  performance: (params?: any) => apiClient.get("/reports/performance", { params }),
  export: (type: string, params?: any) => apiClient.get(`/reports/export/${type}`, { params, responseType: "blob" }),
};

export const settingsAPI = {
  get: () => apiClient.get("/settings"),
  update: (data: any) => apiClient.put("/settings", data),
  notifications: () => apiClient.get("/notifications/settings"),
  updateNotifications: (data: any) => apiClient.put("/notifications/settings", data),
  events: () => apiClient.get("/academy-events"),
  createEvent: (data: any) => apiClient.post("/academy-events", data),
  branches: () => apiClient.get("/organization/branches"),
  addBranch: (data: any) => apiClient.post("/organization/branches", data),
  inviteOwner: (data: any) => apiClient.post("/organization/invitations", data),
};

export const staffAPI = {
  list: (params?: any) => apiClient.get("/staff", { params }),
  get: (id: number) => apiClient.get(`/staff/${id}`),
  create: (data: any) => apiClient.post("/staff", data),
  update: (id: number, data: any) => apiClient.put(`/staff/${id}`, data),
  delete: (id: number) => apiClient.delete(`/staff/${id}`),
  updatePermissions: (id: number, permissions: any) => apiClient.put(`/staff/${id}/permissions`, { permissions }),
  users: (params?: any) => apiClient.get("/admin/users", { params }),
};

export const smsAPI = {
  send: (data: any) => apiClient.post("/sms/send", data),
  sendBulk: (data: any) => apiClient.post("/sms/send-bulk", data),
  recipientsCount: (params?: any) => apiClient.get("/sms/recipients-count", { params }),
  logs: (params?: any) => apiClient.get("/sms/logs", { params }),
  senderNumbers: () => apiClient.get("/sms/sender-numbers"),
  templates: () => apiClient.get("/notifications/templates"),
  createTemplate: (data: any) => apiClient.post("/notifications/templates", data),
  updateTemplate: (id: number, data: any) => apiClient.put(`/notifications/templates/${id}`, data),
  deleteTemplate: (id: number) => apiClient.delete(`/notifications/templates/${id}`),
  testSend: (data: any) => apiClient.post("/notifications/test", data),
};
