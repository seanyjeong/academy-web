import apiClient from "./client";

// --- Report types ---

interface ReportParams {
  period?: string;
  year_month?: string;
  [key: string]: string | number | undefined;
}

export const reportsAPI = {
  dashboard: (params?: ReportParams) => apiClient.get("/reports/dashboard", { params }),
  performance: (params?: ReportParams) => apiClient.get("/reports/performance", { params }),
  export: (type: string, params?: ReportParams) =>
    apiClient.get(`/reports/export/${type}`, { params, responseType: "blob" }),
};

// --- Settings types ---

interface AcademySettings {
  name?: string;
  phone?: string;
  address?: string;
  modules?: string[];
  morning_start?: string;
  morning_end?: string;
  afternoon_start?: string;
  afternoon_end?: string;
  evening_start?: string;
  evening_end?: string;
  payment_due_day?: number;
  tuition_settings?: string | Record<string, unknown>;
  season_fees?: string | Record<string, unknown>;
  salary_settings?: string | Record<string, unknown>;
  first_season?: { name: string; start_date?: string; end_date?: string };
}

interface NotificationSettings {
  provider?: "solapi" | "sens";
  solapi_api_key?: string;
  solapi_api_secret?: string;
  solapi_sender?: string;
  solapi_pfid?: string;
  solapi_templates?: string;
  sens_access_key?: string;
  sens_secret_key?: string;
  sens_service_id?: string;
  sens_sender?: string;
  sens_templates?: string;
}

interface AcademyEvent {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  type?: string;
}

interface BranchCreate {
  name: string;
  address?: string;
}

interface InviteOwner {
  email: string;
}

export const settingsAPI = {
  get: () => apiClient.get("/settings"),
  update: <T extends Partial<AcademySettings>>(data: T) => apiClient.put("/settings", data),
  notifications: () => apiClient.get("/notifications/settings"),
  updateNotifications: (data: Partial<NotificationSettings>) => apiClient.put("/notifications/settings", data),
  events: () => apiClient.get("/academy-events"),
  createEvent: (data: AcademyEvent) => apiClient.post("/academy-events", data),
  branches: () => apiClient.get("/organization/branches"),
  addBranch: (data: BranchCreate) => apiClient.post("/organization/branches", data),
  inviteOwner: (data: InviteOwner) => apiClient.post("/organization/invitations", data),
};

// --- Staff types ---

interface StaffCreate {
  name: string;
  email: string;
  role?: string;
  [key: string]: string | number | undefined;
}

interface StaffUpdate {
  name?: string;
  email?: string;
  role?: string;
  [key: string]: string | number | undefined;
}

interface StaffPermissions {
  [resource: string]: { view?: boolean; edit?: boolean };
}

interface StaffListParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export const staffAPI = {
  list: (params?: StaffListParams) => apiClient.get("/staff", { params }),
  get: (id: number) => apiClient.get(`/staff/${id}`),
  create: (data: StaffCreate) => apiClient.post("/staff", data),
  update: (id: number, data: StaffUpdate) => apiClient.put(`/staff/${id}`, data),
  delete: (id: number) => apiClient.delete(`/staff/${id}`),
  updatePermissions: (id: number, permissions: StaffPermissions) =>
    apiClient.put(`/staff/${id}/permissions`, { permissions }),
  users: (params?: StaffListParams) => apiClient.get("/admin/users", { params }),
};

// --- SMS types ---

interface SmsSendData {
  phone: string;
  message: string;
  message_type?: string;
}

interface SmsBulkSendData {
  target: string;
  status_filter?: string;
  message_type: string;
  message: string;
}

interface SmsRecipientsParams {
  target?: string;
  status?: string;
}

interface SmsLogsParams {
  page?: number;
  limit?: number;
}

interface SmsTemplate {
  type: string;
  content: string;
  name?: string;
}

interface SmsTestSend {
  type: string;
  phone?: string;
}

export const smsAPI = {
  send: (data: SmsSendData) => apiClient.post("/sms/send", data),
  sendBulk: (data: SmsBulkSendData) => apiClient.post("/sms/send-bulk", data),
  recipientsCount: (params?: SmsRecipientsParams) => apiClient.get("/sms/recipients-count", { params }),
  logs: (params?: SmsLogsParams) => apiClient.get("/sms/logs", { params }),
  senderNumbers: () => apiClient.get("/sms/sender-numbers"),
  templates: () => apiClient.get("/notifications/templates"),
  createTemplate: (data: SmsTemplate) => apiClient.post("/notifications/templates", data),
  updateTemplate: (id: number, data: Partial<SmsTemplate>) =>
    apiClient.put(`/notifications/templates/${id}`, data),
  deleteTemplate: (id: number) => apiClient.delete(`/notifications/templates/${id}`),
  testSend: (data: SmsTestSend) => apiClient.post("/notifications/test", data),
};
