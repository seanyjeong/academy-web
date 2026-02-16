// === Record Types (종목) ===
export interface RecordType {
  id: number;
  academy_id: number;
  name: string;
  unit: string | null;
  direction: "higher" | "lower";
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

// === Score Tables (배점표) ===
export interface ScoreRange {
  id?: number;
  score_table_id?: number;
  min_value: number;
  max_value: number;
  score: number;
  grade: string | null;
}

export interface ScoreTable {
  id: number;
  academy_id: number;
  record_type_id: number;
  gender: string | null;
  name: string | null;
  ranges: ScoreRange[];
  created_at?: string;
}

// === Exercises (운동) ===
export interface Exercise {
  id: number;
  academy_id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at?: string;
}

export interface ExerciseTag {
  id: number;
  academy_id: number;
  name: string;
  color: string | null;
}

export interface ExercisePack {
  id: number;
  academy_id: number;
  name: string;
  exercises: string | null;
  tags: string | null;
  created_at?: string;
}

// === Daily Plans (수업 계획) ===
export interface DailyPlan {
  id: number;
  academy_id: number;
  author_id: number;
  date: string;
  time_slot: string;
  class_id: number | null;
  exercises: string | null;
  tags: string | null;
  conditions: string | null;
  created_at?: string;
  updated_at?: string;
}

// === Training Presets (프리셋) ===
export interface TrainingPreset {
  id: number;
  academy_id: number;
  name: string;
  exercises: string | null;
  tags: string | null;
  created_at?: string;
  updated_at?: string;
}

// === Student Records (측정 기록) ===
export interface StudentRecord {
  id: number;
  academy_id: number;
  student_id: number;
  record_type_id: number;
  value: number;
  measured_at: string;
  recorded_by: number;
  created_at?: string;
}

// === Daily Assignments (배정) ===
export interface DailyAssignment {
  id: number;
  academy_id: number;
  student_id: number;
  date: string;
  time_slot: string;
  class_id: number | null;
  created_at?: string;
}

export interface ClassInstructor {
  id: number;
  academy_id: number;
  date: string;
  time_slot: string;
  class_id: number;
  instructor_id: number;
  role: string;
}

// === Training Logs (수업 일지) ===
export interface TrainingLog {
  id: number;
  academy_id: number;
  student_id: number;
  date: string;
  time_slot: string | null;
  class_id: number | null;
  content: string | null;
  instructor_id: number | null;
  condition?: string;
  created_at?: string;
}

// === Monthly Tests (월별 테스트) ===
export interface MonthlyTest {
  id: number;
  academy_id: number;
  name: string;
  year_month: string;
  status: "draft" | "active" | "completed";
  created_at?: string;
}

export interface TestSession {
  id: number;
  test_id: number;
  academy_id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  created_at?: string;
}

export interface TestParticipant {
  id: number;
  test_id: number;
  student_id: number;
  created_at?: string;
}

export interface TestGroup {
  id: number;
  test_id: number;
  name: string;
  student_ids: number[] | string | null;
  created_at?: string;
}

export interface TestRecord {
  id: number;
  session_id: number;
  student_id: number;
  record_type_id: number;
  value: number | null;
  score: number | null;
  grade: string | null;
  recorded_by: number;
  created_at?: string;
}

export interface TestRanking {
  rank: number;
  student_id: number;
  student_name?: string;
  total_score: number;
}

// === Stats ===
export interface RecordAverage {
  record_type_id: number;
  avg_value: number | null;
  count: number;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: number;
  student_name: string;
  best_value: number;
}

// === Training Settings ===
export interface TrainingSettings {
  academy_id: number;
  default_time_slots: string[];
  record_display_count: number;
  allow_self_record: boolean;
  [key: string]: unknown;
}

// === Label Maps ===
export const TIME_SLOT_MAP = {
  morning: "오전반",
  afternoon: "오후반",
  evening: "저녁반",
} as const;

export const TEST_STATUS_MAP = {
  draft: "준비중",
  active: "진행중",
  completed: "완료",
} as const;

export const DIRECTION_MAP = {
  higher: "높을수록 좋음",
  lower: "낮을수록 좋음",
} as const;

export const GENDER_MAP = {
  male: "남",
  female: "여",
} as const;

export const CONDITION_OPTIONS = [
  { value: "excellent", label: "최상", color: "text-green-600" },
  { value: "good", label: "양호", color: "text-blue-600" },
  { value: "normal", label: "보통", color: "text-gray-600" },
  { value: "poor", label: "부진", color: "text-orange-600" },
  { value: "bad", label: "불량", color: "text-red-600" },
] as const;

// === Legacy Aliases (backward compat for existing pages) ===
/** @deprecated Use DailyPlan instead */
export type TrainingPlan = DailyPlan;

/** @deprecated Use TrainingPreset instead */
export type Preset = TrainingPreset;

/** @deprecated Use DailyAssignment instead */
export type Assignment = DailyAssignment;

/** @deprecated Record types are now dynamic via RecordType. Remove hardcoded columns. */
export const RECORD_COLUMNS = [
  { key: "sprint_100m", label: "100m", unit: "초" },
  { key: "standing_long_jump", label: "제자리멀리뛰기", unit: "cm" },
  { key: "back_strength", label: "배근력", unit: "kg" },
  { key: "situps", label: "윗몸일으키기", unit: "회" },
] as const;
