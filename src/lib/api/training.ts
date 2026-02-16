import apiClient from "./client";

type Payload = Record<string, unknown>;
type Params = Record<string, string | number | boolean | undefined>;

// === Record Types (종목) ===
export const recordTypesAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/record-types", { params }),
  create: (data: Payload) =>
    apiClient.post("/training/record-types", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/record-types/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/record-types/${id}`),
};

// === Score Tables (배점표) ===
export const scoreTablesAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/score-tables", { params }),
  getByType: (typeId: number) =>
    apiClient.get(`/training/score-tables/by-type/${typeId}`),
  get: (id: number) =>
    apiClient.get(`/training/score-tables/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/score-tables", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/score-tables/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/score-tables/${id}`),
};

// === Exercises (운동) ===
export const exercisesAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/exercises", { params }),
  get: (id: number) =>
    apiClient.get(`/training/exercises/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/exercises", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/exercises/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/exercises/${id}`),
};

// === Exercise Tags ===
export const tagsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/exercises/tags", { params }),
  get: (id: number) =>
    apiClient.get(`/training/exercises/tags/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/exercises/tags", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/exercises/tags/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/exercises/tags/${id}`),
};

// === Exercise Packs ===
export const packsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/exercises/packs", { params }),
  get: (id: number) =>
    apiClient.get(`/training/exercises/packs/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/exercises/packs", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/exercises/packs/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/exercises/packs/${id}`),
  apply: (id: number, data: Payload) =>
    apiClient.post(`/training/exercises/packs/${id}/apply`, data),
};

// === Daily Plans (수업 계획) ===
export const plansAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/plans", { params }),
  get: (id: number) =>
    apiClient.get(`/training/plans/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/plans", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/plans/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/plans/${id}`),
  updateExercise: (id: number, data: Payload) =>
    apiClient.put(`/training/plans/${id}/exercise`, data),
  addExtra: (id: number, data: Payload) =>
    apiClient.post(`/training/plans/${id}/extra`, data),
};

// === Training Presets (프리셋) ===
export const presetsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/presets", { params }),
  get: (id: number) =>
    apiClient.get(`/training/presets/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/presets", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/presets/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/presets/${id}`),
};

// === Student Records (측정 기록) ===
export const recordsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/records", { params }),
  byDate: (params?: Params) =>
    apiClient.get("/training/records/by-date", { params }),
  stats: (params?: Params) =>
    apiClient.get("/training/records/stats", { params }),
  create: (data: Payload) =>
    apiClient.post("/training/records", data),
  batchCreate: (data: Payload) =>
    apiClient.post("/training/records/batch", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/records/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/records/${id}`),
};

// === Daily Assignments (배정) ===
export const assignmentsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/assignments", { params }),
  create: (data: Payload) =>
    apiClient.post("/training/assignments", data),
  bulkCreate: (data: Payload) =>
    apiClient.post("/training/assignments/bulk", data),
  bulkUpdate: (data: Payload) =>
    apiClient.put("/training/assignments/bulk", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/assignments/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/assignments/${id}`),
  sync: (data: Payload) =>
    apiClient.post("/training/assignments/sync", data),
  syncStudents: (data: Payload) =>
    apiClient.post("/training/assignments/students/sync", data),
  reset: (data: Payload) =>
    apiClient.post("/training/assignments/reset", data),
  listInstructors: (params?: Params) =>
    apiClient.get("/training/assignments/instructors", { params }),
  assignInstructor: (data: Payload) =>
    apiClient.post("/training/assignments/instructors", data),
};

// === Training Logs (수업 일지) ===
export const logsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/training-logs", { params }),
  create: (data: Payload) =>
    apiClient.post("/training/training-logs", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/training-logs/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/training-logs/${id}`),
  updateCondition: (id: number, data: Payload) =>
    apiClient.put(`/training/training-logs/${id}/condition`, data),
};

// === Monthly Tests (월별 테스트) ===
export const testsAPI = {
  // Tests CRUD
  list: (params?: Params) =>
    apiClient.get("/training/tests", { params }),
  get: (id: number) =>
    apiClient.get(`/training/tests/${id}`),
  create: (data: Payload) =>
    apiClient.post("/training/tests", data),
  update: (id: number, data: Payload) =>
    apiClient.put(`/training/tests/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/tests/${id}`),
  rankings: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/rankings`),

  // Participants
  listParticipants: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/participants`),
  addParticipant: (testId: number, data: Payload) =>
    apiClient.post(`/training/tests/${testId}/participants`, data),
  removeParticipant: (testId: number, participantId: number) =>
    apiClient.delete(`/training/tests/${testId}/participants/${participantId}`),

  // Groups
  listGroups: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/groups`),
  createGroup: (testId: number, data: Payload) =>
    apiClient.post(`/training/tests/${testId}/groups`, data),
  updateGroup: (testId: number, groupId: number, data: Payload) =>
    apiClient.put(`/training/tests/${testId}/groups/${groupId}`, data),
  deleteGroup: (testId: number, groupId: number) =>
    apiClient.delete(`/training/tests/${testId}/groups/${groupId}`),

  // Sessions
  listSessions: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions`),
  createSession: (testId: number, data: Payload) =>
    apiClient.post(`/training/tests/${testId}/sessions`, data),
  getSession: (testId: number, sessionId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions/${sessionId}`),
  deleteSession: (sessionId: number) =>
    apiClient.delete(`/training/tests/sessions/${sessionId}`),

  // Session sub-resources
  sessionGroups: (sessionId: number) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/groups`),
  assignSessionGroups: (sessionId: number, data: Payload) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/groups`, data),
  sessionParticipants: (sessionId: number) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/participants`),
  syncSessionParticipants: (sessionId: number, data: Payload) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/participants/sync`, data),
  sessionSchedule: (sessionId: number) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/schedule`),
  updateSessionSchedule: (sessionId: number, data: Payload) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/schedule`, data),

  // Session Records
  sessionRecords: (sessionId: number, params?: Params) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/records`, { params }),
  createSessionRecord: (sessionId: number, data: Payload) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/records`, data),
  updateSessionRecord: (sessionId: number, recordId: number, data: Payload) =>
    apiClient.put(`/training/tests/sessions/${sessionId}/records/${recordId}`, data),
  deleteSessionRecord: (sessionId: number, recordId: number) =>
    apiClient.delete(`/training/tests/sessions/${sessionId}/records/${recordId}`),

  // Legacy compat (old signature: testsAPI.sessions(testId))
  sessions: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions`),
  session: (testId: number, sessionId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions/${sessionId}`),
  saveRecords: (_testId: number, sessionId: number, data: Payload) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/records`, data),
};

// === Stats ===
export const trainingStatsAPI = {
  averages: (params?: Params) =>
    apiClient.get("/training/stats/averages", { params }),
  leaderboard: (params?: Params) =>
    apiClient.get("/training/stats/leaderboard", { params }),
  // Legacy compat
  overview: (params?: Params) =>
    apiClient.get("/training/stats/averages", { params }),
};

// === Training Settings ===
export const trainingSettingsAPI = {
  get: (params?: Params) =>
    apiClient.get("/training/settings", { params }),
  update: (data: Payload) =>
    apiClient.post("/training/settings", data),
};

// === Public Scoreboard ===
export const scoreboardAPI = {
  get: (slug: string, params?: Params) =>
    apiClient.get(`/public/scoreboard/${slug}`, { params }),
  scores: (slug: string, params?: Params) =>
    apiClient.get(`/public/scoreboard/${slug}/scores`, { params }),
};
