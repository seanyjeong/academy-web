export interface TrainingRecord {
  id: number;
  student_id: number;
  student_name?: string;
  date: string;
  time_slot: "morning" | "afternoon" | "evening";
  records: Record<string, number | string | null>;
  memo?: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  unit: string;
  tags: string[];
  description?: string;
}

export interface TrainingPlan {
  id: number;
  student_id: number;
  student_name?: string;
  start_date: string;
  end_date: string;
  exercises: PlanExercise[];
  memo?: string;
  created_at: string;
}

export interface PlanExercise {
  exercise_id: number;
  exercise_name: string;
  sets?: number;
  reps?: number;
  target?: string;
}

export interface TrainingLog {
  id: number;
  date: string;
  title?: string;
  student_ids: number[];
  student_names?: string[];
  exercises_performed: string[];
  notes?: string;
  created_at: string;
}

export interface Preset {
  id: number;
  name: string;
  description?: string;
  exercises: PlanExercise[];
  created_at: string;
}

export interface MonthlyTest {
  id: number;
  name: string;
  date: string;
  record_type_ids: number[];
  status: "draft" | "active" | "completed";
}

export interface TestSession {
  id: number;
  test_id: number;
  name: string;
  date: string;
  time_slot?: "morning" | "afternoon" | "evening";
}

export interface TestRecord {
  student_id: number;
  student_name?: string;
  records: Record<string, number | string | null>;
}

export interface TestRanking {
  rank: number;
  student_id: number;
  student_name: string;
  total_score: number;
  records: Record<string, number | string | null>;
}

export interface Assignment {
  student_id: number;
  student_name: string;
  time_slot: "morning" | "afternoon" | "evening";
  group?: string;
}

export interface TrainingStats {
  total_records: number;
  total_students: number;
  avg_attendance: number;
  trends: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: number;
  student_name: string;
  score: number;
  category?: string;
}

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

export const RECORD_COLUMNS = [
  { key: "sprint_100m", label: "100m", unit: "초" },
  { key: "standing_long_jump", label: "제자리멀리뛰기", unit: "cm" },
  { key: "back_strength", label: "배근력", unit: "kg" },
  { key: "situps", label: "윗몸일으키기", unit: "회" },
] as const;
