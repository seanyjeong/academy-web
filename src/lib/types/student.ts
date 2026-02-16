export type StudentStatus = "active" | "paused" | "withdrawn" | "graduated" | "trial" | "pending";
export type StudentType = "exam" | "adult";
export type Gender = "male" | "female";
export type AdmissionType = "regular" | "early" | "arts_physical";
export type TimeSlot = "morning" | "afternoon" | "evening";
export type Grade = "중3" | "고1" | "고2" | "고3" | "N수" | "성인";

export interface TrialDate {
  date: string;
  time_slot: TimeSlot;
  attended?: boolean;
}

export interface Student {
  id: number;
  student_number?: string;
  name: string;
  gender?: Gender;
  student_type: StudentType;
  grade?: string;
  admission_type: AdmissionType;
  phone?: string;
  parent_phone?: string;
  school?: string;
  address?: string;
  class_days?: number[] | string;
  weekly_count?: number;
  monthly_tuition: number;
  discount_rate: number;
  discount_reason?: string;
  payment_due_day?: number;
  final_monthly_tuition: number;
  status: StudentStatus;
  time_slot?: TimeSlot;
  is_trial: boolean;
  trial_remaining?: number;
  trial_dates?: TrialDate[] | string | null;
  rest_start_date?: string;
  rest_end_date?: string;
  rest_reason?: string;
  is_season_registered: boolean;
  current_season_id?: number;
  memo?: string;
  enrollment_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface StudentFormData {
  name: string;
  gender?: Gender;
  student_type: StudentType;
  grade?: string;
  admission_type: AdmissionType;
  phone?: string;
  parent_phone?: string;
  school?: string;
  address?: string;
  class_days: number[];
  weekly_count: number;
  monthly_tuition: number;
  discount_rate: number;
  discount_reason?: string;
  payment_due_day?: number;
  time_slot?: TimeSlot;
  is_trial: boolean;
  trial_dates?: TrialDate[];
  memo?: string;
  status: StudentStatus;
}

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "재원",
  paused: "휴원",
  withdrawn: "퇴원",
  graduated: "졸업",
  trial: "체험",
  pending: "미등록",
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
};

export const STUDENT_TYPE_LABELS: Record<StudentType, string> = {
  exam: "입시",
  adult: "일반",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "남",
  female: "여",
};

export const ADMISSION_TYPE_LABELS: Record<AdmissionType, string> = {
  regular: "정시",
  early: "수시",
  arts_physical: "예체능",
};

export const GRADE_OPTIONS: Grade[] = ["중3", "고1", "고2", "고3", "N수", "성인"];

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
