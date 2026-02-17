import apiClient from "./client";

type Params = Record<string, string | number | boolean | undefined>;

// Flexible data type: documents known fields while allowing extras
type Data<T> = T & Record<string, unknown>;

// === Typed interfaces ===

export interface RecordTypeData {
  name: string;
  unit?: string;
  direction?: "higher" | "lower";
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ScoreTableData {
  record_type_id: number;
  gender?: string;
  age_group?: string;
  ranges?: { min: number; max: number; score: number }[];
}

export interface ExerciseData {
  name: string;
  description?: string;
  category?: string;
  video_url?: string;
  image_url?: string;
  tag_ids?: number[];
}

export interface TagData {
  name: string;
  color?: string;
}

export interface PackData {
  name: string;
  description?: string;
  exercise_ids?: number[];
}

export interface PlanData {
  date: string;
  class_id?: number;
  instructor_id?: number;
  time_slot?: string;
  exercises?: unknown;
}

export interface PresetData {
  name: string;
  description?: string;
  exercises?: unknown;
  tags?: unknown;
}

export interface RecordData {
  student_id: number;
  record_type_id: number;
  value: number;
  recorded_date?: string;
  measured_at?: string;
  notes?: string;
}

export interface AssignmentData {
  student_id?: number;
  class_id?: number | null;
  date?: string;
  time_slot?: string;
}

export interface LogData {
  date?: string;
  class_id?: number;
  instructor_id?: number;
  content?: string;
  notes?: string;
  condition?: string;
  student_id?: number;
}

export interface TestData {
  name: string;
  description?: string;
  test_date?: string;
  year_month?: string;
  status?: string;
  record_type_ids?: number[];
}

export interface TestSessionData {
  name?: string;
  session_date?: string;
  date?: string;
  record_type_ids?: number[];
}

export interface SessionRecordData {
  student_id: number;
  record_type_id: number;
  value: number;
  score?: number | null;
  grade?: string | null;
  notes?: string;
}

export interface TrainingSettingsData {
  default_record_types?: number[];
  scoreboard_slug?: string;
  scoreboard_enabled?: boolean;
}

// === Record Types (종목) ===
export const recordTypesAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/record-types", { params }),
  create: (data: Data<RecordTypeData>) =>
    apiClient.post("/training/record-types", data),
  update: (id: number, data: Data<Partial<RecordTypeData>>) =>
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
  create: (data: Data<ScoreTableData>) =>
    apiClient.post("/training/score-tables", data),
  update: (id: number, data: Data<Partial<ScoreTableData>>) =>
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
  create: (data: Data<ExerciseData>) =>
    apiClient.post("/training/exercises", data),
  update: (id: number, data: Data<Partial<ExerciseData>>) =>
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
  create: (data: Data<TagData>) =>
    apiClient.post("/training/exercises/tags", data),
  update: (id: number, data: Data<Partial<TagData>>) =>
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
  create: (data: Data<PackData>) =>
    apiClient.post("/training/exercises/packs", data),
  update: (id: number, data: Data<Partial<PackData>>) =>
    apiClient.put(`/training/exercises/packs/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/exercises/packs/${id}`),
  apply: (id: number, data: Data<{ date?: string; student_ids?: number[]; class_id?: number; plan_id?: number }>) =>
    apiClient.post(`/training/exercises/packs/${id}/apply`, data),
};

// === Daily Plans (수업 계획) ===
export const plansAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/plans", { params }),
  get: (id: number) =>
    apiClient.get(`/training/plans/${id}`),
  create: (data: Data<PlanData>) =>
    apiClient.post("/training/plans", data),
  update: (id: number, data: Data<Partial<PlanData>>) =>
    apiClient.put(`/training/plans/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/plans/${id}`),
  updateExercise: (id: number, data: Data<{ exercise_id?: number; exercise?: unknown }>) =>
    apiClient.put(`/training/plans/${id}/exercise`, data),
  addExtra: (id: number, data: Data<{ exercise_id?: number; exercise?: unknown }>) =>
    apiClient.post(`/training/plans/${id}/extra`, data),
};

// === Training Presets (프리셋) ===
export const presetsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/presets", { params }),
  get: (id: number) =>
    apiClient.get(`/training/presets/${id}`),
  create: (data: Data<PresetData>) =>
    apiClient.post("/training/presets", data),
  update: (id: number, data: Data<Partial<PresetData>>) =>
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
  create: (data: Data<RecordData>) =>
    apiClient.post("/training/records", data),
  batchCreate: (data: Data<{ records: Data<RecordData>[] }>) =>
    apiClient.post("/training/records/batch", data),
  update: (id: number, data: Data<Partial<RecordData>>) =>
    apiClient.put(`/training/records/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/records/${id}`),
};

// === Daily Assignments (배정) ===
export const assignmentsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/assignments", { params }),
  create: (data: Data<AssignmentData>) =>
    apiClient.post("/training/assignments", data),
  bulkCreate: (data: Data<{ student_ids?: number[]; class_id?: number; date?: string; time_slot?: string; assignments?: unknown }>) =>
    apiClient.post("/training/assignments/bulk", data),
  bulkUpdate: (data: Data<{ student_ids: number[]; class_id?: number; date?: string; time_slot?: string }>) =>
    apiClient.put("/training/assignments/bulk", data),
  update: (id: number, data: Data<Partial<AssignmentData>>) =>
    apiClient.put(`/training/assignments/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/assignments/${id}`),
  sync: (data: Data<{ date?: string; class_id?: number; student_ids?: number[]; time_slot?: string }>) =>
    apiClient.post("/training/assignments/sync", data),
  syncStudents: (data: Data<{ date?: string; class_id?: number; student_ids?: number[] }>) =>
    apiClient.post("/training/assignments/students/sync", data),
  reset: (data: Data<{ date?: string; class_id?: number }>) =>
    apiClient.post("/training/assignments/reset", data),
  listInstructors: (params?: Params) =>
    apiClient.get("/training/assignments/instructors", { params }),
  assignInstructor: (data: Data<{ instructor_id: number; class_id?: number; date?: string; time_slot?: string }>) =>
    apiClient.post("/training/assignments/instructors", data),
};

// === Training Logs (수업 일지) ===
export const logsAPI = {
  list: (params?: Params) =>
    apiClient.get("/training/training-logs", { params }),
  create: (data: Data<LogData>) =>
    apiClient.post("/training/training-logs", data),
  update: (id: number, data: Data<Partial<LogData>>) =>
    apiClient.put(`/training/training-logs/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/training-logs/${id}`),
  updateCondition: (id: number, data: Data<{ condition: string; student_id?: number }>) =>
    apiClient.put(`/training/training-logs/${id}/condition`, data),
};

// === Monthly Tests (월별 테스트) ===
export const testsAPI = {
  // Tests CRUD
  list: (params?: Params) =>
    apiClient.get("/training/tests", { params }),
  get: (id: number) =>
    apiClient.get(`/training/tests/${id}`),
  create: (data: Data<TestData>) =>
    apiClient.post("/training/tests", data),
  update: (id: number, data: Data<Partial<TestData>>) =>
    apiClient.put(`/training/tests/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/training/tests/${id}`),
  rankings: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/rankings`),

  // Participants
  listParticipants: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/participants`),
  addParticipant: (testId: number, data: Data<{ student_id?: number; student_ids?: number[] }>) =>
    apiClient.post(`/training/tests/${testId}/participants`, data),
  removeParticipant: (testId: number, participantId: number) =>
    apiClient.delete(`/training/tests/${testId}/participants/${participantId}`),

  // Groups
  listGroups: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/groups`),
  createGroup: (testId: number, data: Data<{ name: string; student_ids?: number[] }>) =>
    apiClient.post(`/training/tests/${testId}/groups`, data),
  updateGroup: (testId: number, groupId: number, data: Data<{ name?: string; student_ids?: number[] }>) =>
    apiClient.put(`/training/tests/${testId}/groups/${groupId}`, data),
  deleteGroup: (testId: number, groupId: number) =>
    apiClient.delete(`/training/tests/${testId}/groups/${groupId}`),

  // Sessions
  listSessions: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions`),
  createSession: (testId: number, data: Data<TestSessionData>) =>
    apiClient.post(`/training/tests/${testId}/sessions`, data),
  getSession: (testId: number, sessionId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions/${sessionId}`),
  deleteSession: (sessionId: number) =>
    apiClient.delete(`/training/tests/sessions/${sessionId}`),

  // Session sub-resources
  sessionGroups: (sessionId: number) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/groups`),
  assignSessionGroups: (sessionId: number, data: Data<{ group_ids?: number[] }>) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/groups`, data),
  sessionParticipants: (sessionId: number) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/participants`),
  syncSessionParticipants: (sessionId: number, data: Data<{ student_ids?: number[] }>) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/participants/sync`, data),
  sessionSchedule: (sessionId: number) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/schedule`),
  updateSessionSchedule: (sessionId: number, data: Data<{ items?: { record_type_id: number; order: number }[] }>) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/schedule`, data),

  // Session Records
  sessionRecords: (sessionId: number, params?: Params) =>
    apiClient.get(`/training/tests/sessions/${sessionId}/records`, { params }),
  createSessionRecord: (sessionId: number, data: Data<SessionRecordData>) =>
    apiClient.post(`/training/tests/sessions/${sessionId}/records`, data),
  updateSessionRecord: (sessionId: number, recordId: number, data: Data<Partial<SessionRecordData>>) =>
    apiClient.put(`/training/tests/sessions/${sessionId}/records/${recordId}`, data),
  deleteSessionRecord: (sessionId: number, recordId: number) =>
    apiClient.delete(`/training/tests/sessions/${sessionId}/records/${recordId}`),

  // Legacy compat
  sessions: (testId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions`),
  session: (testId: number, sessionId: number) =>
    apiClient.get(`/training/tests/${testId}/sessions/${sessionId}`),
  saveRecords: (_testId: number, sessionId: number, data: Data<{ records?: unknown[] }>) =>
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
  update: (data: Data<TrainingSettingsData>) =>
    apiClient.post("/training/settings", data),
};

// === Public Scoreboard ===
export const scoreboardAPI = {
  get: (slug: string, params?: Params) =>
    apiClient.get(`/public/scoreboard/${slug}`, { params }),
  scores: (slug: string, params?: Params) =>
    apiClient.get(`/public/scoreboard/${slug}/scores`, { params }),
};
