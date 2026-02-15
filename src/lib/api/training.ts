import apiClient from "./client";

type Payload = Record<string, unknown>;
type Params = Record<string, string | number | boolean | undefined>;

export const recordsAPI = {
  list: (params?: { date?: string; time_slot?: string }) =>
    apiClient.get("/training/records", { params }),
  create: (data: Payload) => apiClient.post("/training/records", data),
  batchCreate: (data: Payload) =>
    apiClient.post("/training/records/batch", data),
  byStudent: (studentId: number, params?: Params) =>
    apiClient.get(`/training/records/student/${studentId}`, { params }),
};

export const plansAPI = {
  list: (params?: Params) => apiClient.get("/training/plans", { params }),
  get: (id: number) => apiClient.get(`/training/plans/${id}`),
  create: (data: Payload) => apiClient.post("/training/plans", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/plans/${id}`, data),
};

export const logsAPI = {
  list: (params?: Params) => apiClient.get("/training/logs", { params }),
  create: (data: Payload) => apiClient.post("/training/logs", data),
};

export const exercisesAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/exercises", { params }),
  get: (id: number) => apiClient.get(`/training/exercises/${id}`),
  create: (data: Payload) => apiClient.post("/training/exercises", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/exercises/${id}`, data),
  delete: (id: number) => apiClient.delete(`/training/exercises/${id}`),
  tags: () => apiClient.get("/training/exercises/tags"),
  packs: () => apiClient.get("/training/exercises/packs"),
};

export const presetsAPI = {
  list: () => apiClient.get("/training/presets"),
  get: (id: number) => apiClient.get(`/training/presets/${id}`),
  create: (data: Payload) => apiClient.post("/training/presets", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/presets/${id}`, data),
  delete: (id: number) => apiClient.delete(`/training/presets/${id}`),
};

export const testsAPI = {
  list: () => apiClient.get("/training/tests"),
  get: (id: number) => apiClient.get(`/training/tests/${id}`),
  create: (data: Payload) => apiClient.post("/training/tests", data),
  sessions: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions`),
  session: (testId: number, sessionId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions/${sessionId}`),
  sessionRecords: (testId: number, sessionId: number) =>
    apiClient.get(
      `/training/tests/${testId}/sessions/${sessionId}/records`
    ),
  saveRecords: (testId: number, sessionId: number, data: Payload) =>
    apiClient.post(
      `/training/tests/${testId}/sessions/${sessionId}/records`,
      data
    ),
  rankings: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/rankings`),
};

export const assignmentsAPI = {
  list: () => apiClient.get("/training/assignments"),
  update: (data: Payload) => apiClient.put("/training/assignments", data),
};

export const trainingStatsAPI = {
  overview: (params?: Params) =>
    apiClient.get("/training/stats", { params }),
  leaderboard: (params?: Params) =>
    apiClient.get("/training/stats/leaderboard", { params }),
};
