export type StudentStatus =
  | "active"
  | "paused"
  | "withdrawn"
  | "graduated"
  | "trial"
  | "pending";

export interface Student {
  id: number;
  name: string;
  phone?: string;
  parent_phone?: string;
  school?: string;
  grade?: string;
  status: StudentStatus;
  time_slot?: "morning" | "afternoon" | "evening";
  memo?: string;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "재원",
  paused: "휴원",
  withdrawn: "퇴원",
  graduated: "졸업",
  trial: "체험",
  pending: "미등록",
};

export const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
};
