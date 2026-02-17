"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, ExternalLink, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { studentsAPI } from "@/lib/api/students";
import { attendanceAPI } from "@/lib/api/attendance";
import { recordsAPI, recordTypesAPI } from "@/lib/api/training";
import type { RecordType, StudentRecord } from "@/lib/types/training";
import apiClient from "@/lib/api/client";
import { formatKRW, formatDate } from "@/lib/format";
import {
  Student,
  StudentStatus,
  StudentType,
  Gender,
  Grade,
  AdmissionType,
  TimeSlot,
  TrialDate,
  STATUS_LABELS,
  TIME_SLOT_LABELS,
  STUDENT_TYPE_LABELS,
  GENDER_LABELS,
  ADMISSION_TYPE_LABELS,
  DAY_LABELS,
} from "@/lib/types/student";

// --- Constants ---

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: "bg-blue-50 text-blue-600",
  trial: "bg-amber-50 text-amber-600",
  paused: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
  graduated: "bg-green-50 text-green-600",
  pending: "bg-slate-50 text-slate-400",
};

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "출석",
  absent: "결석",
  late: "지각",
  excused: "사유결석",
};

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: "bg-blue-50 text-blue-600",
  absent: "bg-red-50 text-red-600",
  late: "bg-amber-50 text-amber-600",
  excused: "bg-orange-50 text-orange-600",
};

const EXAM_GRADES: Grade[] = ["중3", "고1", "고2", "고3", "N수"];
const ADULT_GRADES: Grade[] = ["성인"];

// --- Types ---

interface PaymentRecord {
  id: number;
  payment_month?: string;
  base_amount?: number;
  final_amount?: number;
  paid_amount?: number;
  status?: string;
  paid_date?: string;
}

interface AttendanceRecord {
  id?: number;
  date: string;
  status: string;
}

interface ConsultationRecord {
  id: number;
  consultation_date?: string;
  type?: string;
  content?: string;
  counselor?: string;
}

// --- Helpers ---

function parseClassDays(classDays: number[] | string | undefined): number[] {
  if (!classDays) return [];
  if (typeof classDays === "string") {
    try {
      return JSON.parse(classDays);
    } catch {
      return [];
    }
  }
  return classDays;
}

function parseTrialDates(
  trialDates: TrialDate[] | string | null | undefined
): TrialDate[] {
  if (!trialDates) return [];
  if (typeof trialDates === "string") {
    try {
      return JSON.parse(trialDates);
    } catch {
      return [];
    }
  }
  return trialDates;
}

function formatPhone(value: string): string {
  const nums = value.replace(/[^0-9]/g, "");
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "미납",
  paid: "완납",
  partial: "부분납",
  overdue: "연체",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
  partial: "bg-blue-50 text-blue-600",
  overdue: "bg-red-50 text-red-600",
};

// --- Component ---

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  // Core state
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [graduateOpen, setGraduateOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);

  // Pause form
  const [pauseForm, setPauseForm] = useState({
    rest_start_date: "",
    rest_end_date: "",
    rest_reason: "",
  });

  // Tab data
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);

  // Training data
  const [trainingRecords, setTrainingRecords] = useState<StudentRecord[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<RecordType[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Edit form
  const [form, setForm] = useState({
    name: "",
    gender: undefined as Gender | undefined,
    student_type: "exam" as StudentType,
    grade: undefined as string | undefined,
    admission_type: "regular" as AdmissionType,
    phone: "",
    parent_phone: "",
    school: "",
    address: "",
    class_days: [] as number[],
    weekly_count: 0,
    monthly_tuition: 0,
    discount_rate: 0,
    discount_reason: "",
    payment_due_day: undefined as number | undefined,
    time_slot: undefined as TimeSlot | undefined,
    memo: "",
    status: "active" as StudentStatus,
    enrollment_date: "",
  });

  // Final tuition calculation
  const finalTuition = useMemo(() => {
    const base = form.monthly_tuition || 0;
    const rate = form.discount_rate || 0;
    return Math.floor((base * (1 - rate / 100)) / 1000) * 1000;
  }, [form.monthly_tuition, form.discount_rate]);

  const gradeOptions =
    form.student_type === "exam" ? EXAM_GRADES : ADULT_GRADES;

  // --- Data Loading ---

  const loadStudent = useCallback(async () => {
    try {
      const { data } = await studentsAPI.get(id);
      setStudent(data);
      populateForm(data);
    } catch {
      toast.error("학생 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id]);

  function populateForm(data: Student) {
    const days = parseClassDays(data.class_days);
    setForm({
      name: data.name ?? "",
      gender: data.gender,
      student_type: data.student_type ?? "exam",
      grade: data.grade,
      admission_type: data.admission_type ?? "regular",
      phone: data.phone ?? "",
      parent_phone: data.parent_phone ?? "",
      school: data.school ?? "",
      address: data.address ?? "",
      class_days: days,
      weekly_count: data.weekly_count ?? days.length,
      monthly_tuition: data.monthly_tuition ?? 0,
      discount_rate: data.discount_rate ?? 0,
      discount_reason: data.discount_reason ?? "",
      payment_due_day: data.payment_due_day,
      time_slot: data.time_slot,
      memo: data.memo ?? "",
      status: data.status ?? "active",
      enrollment_date: data.enrollment_date ?? "",
    });
  }

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  // Load attendance
  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const { data } = await attendanceAPI.byStudent(id);
      setAttendanceRecords(data.items ?? data ?? []);
    } catch {
      // may not be available
    } finally {
      setAttendanceLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Load payments on tab switch
  async function loadPayments() {
    if (payments.length > 0) return;
    setPaymentsLoading(true);
    try {
      const { data } = await apiClient.get("/payments", {
        params: { student_id: id },
      });
      setPayments(data.items ?? data ?? []);
    } catch {
      // may not be available
    } finally {
      setPaymentsLoading(false);
    }
  }

  // Load consultations on tab switch
  async function loadConsultations() {
    if (consultations.length > 0) return;
    setConsultationsLoading(true);
    try {
      const { data } = await apiClient.get(
        `/student-consultations/student/${id}`
      );
      setConsultations(data.items ?? data ?? []);
    } catch {
      // may not be available
    } finally {
      setConsultationsLoading(false);
    }
  }

  // Load training records
  async function loadTraining() {
    if (trainingRecords.length > 0) return;
    setTrainingLoading(true);
    try {
      const [recRes, typeRes] = await Promise.all([
        recordsAPI.list({ student_id: id, limit: 200 }),
        recordTypesAPI.list(),
      ]);
      const recs = Array.isArray(recRes.data)
        ? recRes.data
        : recRes.data?.items ?? [];
      setTrainingRecords(recs as StudentRecord[]);
      const types = (Array.isArray(typeRes.data) ? typeRes.data : []) as RecordType[];
      setTrainingTypes(types.filter((t) => t.is_active));
    } catch {
      // may not be available
    } finally {
      setTrainingLoading(false);
    }
  }

  // Training chart data
  const radarData = useMemo(() => {
    if (trainingTypes.length === 0 || trainingRecords.length === 0) return [];
    return trainingTypes.map((rt) => {
      const records = trainingRecords
        .filter((r) => r.record_type_id === rt.id)
        .sort((a, b) => b.measured_at.localeCompare(a.measured_at));
      const latest = records[0]?.value ?? 0;
      const best =
        rt.direction === "lower"
          ? Math.min(...records.map((r) => r.value))
          : Math.max(...records.map((r) => r.value));
      return {
        type: rt.name,
        latest: Math.round(latest * 100) / 100,
        best: records.length > 0 ? Math.round(best * 100) / 100 : 0,
        count: records.length,
      };
    }).filter((d) => d.count > 0);
  }, [trainingTypes, trainingRecords]);

  const trendData = useMemo(() => {
    if (trainingRecords.length === 0) return [];
    // Group by date, pick latest value per type per date
    const dateMap = new Map<string, Record<string, number>>();
    for (const rec of trainingRecords) {
      const date = rec.measured_at.slice(0, 10);
      if (!dateMap.has(date)) dateMap.set(date, {});
      const typeRec = trainingTypes.find((t) => t.id === rec.record_type_id);
      if (typeRec) {
        dateMap.get(date)![typeRec.name] = rec.value;
      }
    }
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20) // last 20 days
      .map(([date, values]) => ({ date: date.slice(5), ...values }));
  }, [trainingRecords, trainingTypes]);

  const TREND_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#dc2626"];

  // --- Form helpers ---

  function handleClassDayToggle(day: number) {
    setForm((prev) => {
      const current = prev.class_days;
      const newDays = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b);
      return {
        ...prev,
        class_days: newDays,
        weekly_count: newDays.length,
      };
    });
  }

  // --- Actions ---

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("이름을 입력하세요");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Student> = {
        name: form.name,
        gender: form.gender,
        student_type: form.student_type,
        grade: form.grade || undefined,
        admission_type: form.admission_type,
        phone: form.phone || undefined,
        parent_phone: form.parent_phone || undefined,
        school: form.school || undefined,
        address: form.address || undefined,
        class_days: form.class_days,
        weekly_count: form.weekly_count,
        monthly_tuition: form.monthly_tuition,
        discount_rate: form.discount_rate,
        discount_reason: form.discount_reason || undefined,
        payment_due_day: form.payment_due_day,
        time_slot: form.time_slot,
        memo: form.memo || undefined,
        status: form.status,
        enrollment_date: form.enrollment_date || undefined,
      };
      const { data } = await studentsAPI.update(id, payload);
      setStudent(data);
      populateForm(data);
      setEditing(false);
      toast.success("학생 정보가 수정되었습니다");
    } catch {
      toast.error("수정에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await studentsAPI.delete(id);
      toast.success("학생이 삭제되었습니다");
      router.push("/students");
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  async function handlePause() {
    if (!pauseForm.rest_start_date) {
      toast.error("휴원 시작일을 입력하세요");
      return;
    }
    if (!pauseForm.rest_end_date) {
      toast.error("휴원 종료일을 입력하세요");
      return;
    }
    try {
      const { data } = await studentsAPI.processRest(id, {
        rest_start_date: pauseForm.rest_start_date,
        rest_end_date: pauseForm.rest_end_date,
        rest_reason: pauseForm.rest_reason || undefined,
      });
      setStudent(data);
      populateForm(data);
      setPauseOpen(false);
      setPauseForm({ rest_start_date: "", rest_end_date: "", rest_reason: "" });
      toast.success("휴원 처리되었습니다");
    } catch {
      toast.error("휴원 처리에 실패했습니다");
    }
  }

  async function handleResume() {
    try {
      const { data } = await studentsAPI.resume(id);
      setStudent(data);
      populateForm(data);
      setResumeOpen(false);
      toast.success("복귀 처리되었습니다");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "복귀 처리에 실패했습니다");
    }
  }

  async function handleGraduate() {
    try {
      const { data } = await studentsAPI.update(id, { status: "graduated" });
      setStudent(data);
      populateForm(data);
      setGraduateOpen(false);
      toast.success("졸업 처리되었습니다");
    } catch {
      toast.error("졸업 처리에 실패했습니다");
    }
  }

  async function handleWithdraw() {
    try {
      const { data } = await studentsAPI.withdraw(id, {
        reason: withdrawReason || undefined,
      });
      setStudent(data);
      populateForm(data);
      setWithdrawOpen(false);
      setWithdrawReason("");
      toast.success("퇴원 처리되었습니다");
    } catch {
      toast.error("퇴원 처리에 실패했습니다");
    }
  }

  async function handleEnroll() {
    try {
      const { data } = await studentsAPI.update(id, {
        status: "active",
        is_trial: false,
      });
      setStudent(data);
      populateForm(data);
      setEnrollOpen(false);
      toast.success("정식 등록되었습니다");
    } catch {
      toast.error("등록 처리에 실패했습니다");
    }
  }

  // --- Render helpers ---

  function InfoRow({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <>
        <div className="text-slate-500 text-sm py-2">{label}</div>
        <div className="text-slate-900 text-sm py-2">{children}</div>
      </>
    );
  }

  function DayBadges({ days }: { days: number[] }) {
    if (days.length === 0) return <span className="text-slate-400">-</span>;
    const dayColors = [
      "bg-red-50 text-red-600",
      "bg-blue-50 text-blue-600",
      "bg-green-50 text-green-600",
      "bg-purple-50 text-purple-600",
      "bg-amber-50 text-amber-600",
      "bg-cyan-50 text-cyan-600",
      "bg-pink-50 text-pink-600",
    ];
    return (
      <div className="flex gap-1.5 flex-wrap">
        {days.map((d) => (
          <span
            key={d}
            className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-medium ${dayColors[d] ?? "bg-slate-50 text-slate-600"}`}
          >
            {DAY_LABELS[d]}
          </span>
        ))}
      </div>
    );
  }

  // --- Loading / Error states ---

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-12 text-center text-slate-400">
        학생 정보를 찾을 수 없습니다
      </div>
    );
  }

  const classDays = parseClassDays(student.class_days);
  const trialDates = parseTrialDates(student.trial_dates);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/students">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              {student.name}
            </h1>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[student.status]}
            >
              {STATUS_LABELS[student.status]}
            </Badge>
            {student.is_trial && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-600">
                체험생
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {student.student_number && `#${student.student_number} | `}
            등록일: {student.enrollment_date ? formatDate(student.enrollment_date) : formatDate(student.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (editing) {
                populateForm(student);
              }
              setEditing(!editing);
            }}
          >
            <Pencil className="h-4 w-4" />
            {editing ? "취소" : "수정"}
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>학생 삭제</DialogTitle>
                <DialogDescription>
                  {student.name} 학생을 정말 삭제하시겠습니까? 이 작업은 되돌릴
                  수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  취소
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="info"
        onValueChange={(v) => {
          if (v === "payments") loadPayments();
          if (v === "training") loadTraining();
          if (v === "consultations") loadConsultations();
        }}
      >
        <TabsList>
          <TabsTrigger value="info">기본정보</TabsTrigger>
          <TabsTrigger value="payments">수납내역</TabsTrigger>
          <TabsTrigger value="attendance">출결현황</TabsTrigger>
          <TabsTrigger value="training">훈련기록</TabsTrigger>
          <TabsTrigger value="consultations">상담이력</TabsTrigger>
        </TabsList>

        {/* ==================== INFO TAB ==================== */}
        <TabsContent value="info">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                /* ---------- EDIT MODE ---------- */
                <div className="space-y-6">
                  {/* Basic info section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700">인적사항</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>이름 *</Label>
                        <Input
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>성별</Label>
                        <div className="flex gap-4 pt-2">
                          {(
                            Object.entries(GENDER_LABELS) as [Gender, string][]
                          ).map(([value, label]) => (
                            <label
                              key={value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="gender"
                                value={value}
                                checked={form.gender === value}
                                onChange={() =>
                                  setForm({ ...form, gender: value })
                                }
                                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>학생 유형</Label>
                        <Select
                          value={form.student_type}
                          onValueChange={(v) => {
                            const st = v as StudentType;
                            setForm((prev) => ({
                              ...prev,
                              student_type: st,
                              grade: undefined,
                              admission_type: "regular",
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.entries(STUDENT_TYPE_LABELS) as [
                                StudentType,
                                string,
                              ][]
                            ).map(([v, l]) => (
                              <SelectItem key={v} value={v}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>학년</Label>
                        <Select
                          value={form.grade ?? ""}
                          onValueChange={(v) =>
                            setForm({ ...form, grade: v as Grade })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="학년 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {form.student_type === "exam" && (
                        <div className="space-y-2">
                          <Label>입시 유형</Label>
                          <Select
                            value={form.admission_type}
                            onValueChange={(v) =>
                              setForm({
                                ...form,
                                admission_type: v as AdmissionType,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.entries(ADMISSION_TYPE_LABELS) as [
                                  AdmissionType,
                                  string,
                                ][]
                              ).map(([v, l]) => (
                                <SelectItem key={v} value={v}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>연락처</Label>
                        <Input
                          value={form.phone}
                          maxLength={13}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              phone: formatPhone(e.target.value),
                            })
                          }
                          placeholder="010-0000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>학부모 연락처</Label>
                        <Input
                          value={form.parent_phone}
                          maxLength={13}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              parent_phone: formatPhone(e.target.value),
                            })
                          }
                          placeholder="010-0000-0000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>학교</Label>
                        <Input
                          value={form.school}
                          onChange={(e) =>
                            setForm({ ...form, school: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>주소</Label>
                        <Input
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Class info section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700">수업 정보</h3>
                    <div className="space-y-2">
                      <Label>시간대</Label>
                      <Select
                        value={form.time_slot ?? ""}
                        onValueChange={(v) =>
                          setForm({ ...form, time_slot: v as TimeSlot })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="시간대 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(TIME_SLOT_LABELS) as [
                              TimeSlot,
                              string,
                            ][]
                          ).map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>수업일</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleClassDayToggle(day)}
                            className={`h-10 w-12 rounded-md border text-sm font-medium transition-colors ${
                              form.class_days.includes(day)
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                            }`}
                          >
                            {DAY_LABELS[day]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>주 수업횟수</Label>
                      <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                        주 {form.weekly_count}회
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Tuition section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700">수업료 정보</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>월 수업료</Label>
                        <Input
                          type="number"
                          min={0}
                          step={10000}
                          value={form.monthly_tuition || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              monthly_tuition:
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value),
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>할인율 (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={form.discount_rate || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              discount_rate:
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value),
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {(form.discount_rate || 0) > 0 && (
                      <div className="space-y-2">
                        <Label>할인 사유</Label>
                        <Input
                          value={form.discount_reason}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              discount_reason: e.target.value,
                            })
                          }
                          placeholder="예: 형제자매 할인"
                        />
                      </div>
                    )}

                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">월 수업료</span>
                        <span>{formatKRW(form.monthly_tuition)}</span>
                      </div>
                      {(form.discount_rate || 0) > 0 && (
                        <div className="flex justify-between text-sm text-red-500">
                          <span>할인 ({form.discount_rate}%)</span>
                          <span>
                            -{formatKRW(form.monthly_tuition - finalTuition)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="font-semibold text-sm">
                          최종 수업료
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatKRW(finalTuition)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>납부일</Label>
                      <Select
                        value={form.payment_due_day?.toString() ?? ""}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            payment_due_day: v ? parseInt(v) : undefined,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="학원 기본값 사용" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(
                            (day) => (
                              <SelectItem key={day} value={day.toString()}>
                                매월 {day}일
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Status & enrollment */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700">상태</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>상태</Label>
                        <Select
                          value={form.status}
                          onValueChange={(v) =>
                            setForm({ ...form, status: v as StudentStatus })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.keys(STATUS_LABELS) as StudentStatus[]
                            ).map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>등록일</Label>
                        <Input
                          type="date"
                          value={form.enrollment_date}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              enrollment_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Memo */}
                  <div className="space-y-2">
                    <Label>메모</Label>
                    <textarea
                      value={form.memo}
                      onChange={(e) =>
                        setForm({ ...form, memo: e.target.value })
                      }
                      rows={4}
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        populateForm(student);
                        setEditing(false);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                /* ---------- VIEW MODE ---------- */
                <div className="space-y-1">
                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="이름">{student.name}</InfoRow>
                    <InfoRow label="성별">
                      {student.gender
                        ? GENDER_LABELS[student.gender]
                        : "-"}
                    </InfoRow>
                    <InfoRow label="상태">
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[student.status]}
                      >
                        {STATUS_LABELS[student.status]}
                      </Badge>
                    </InfoRow>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="구분">
                      {STUDENT_TYPE_LABELS[student.student_type] ?? "-"}
                    </InfoRow>
                    <InfoRow label="학년">{student.grade ?? "-"}</InfoRow>
                    <InfoRow label="입학유형">
                      {ADMISSION_TYPE_LABELS[student.admission_type] ?? "-"}
                    </InfoRow>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="연락처">
                      {student.phone ?? "-"}
                    </InfoRow>
                    <InfoRow label="학부모 연락처">
                      {student.parent_phone ?? "-"}
                    </InfoRow>
                    <InfoRow label="학교">{student.school ?? "-"}</InfoRow>
                    <InfoRow label="주소">{student.address ?? "-"}</InfoRow>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="수업요일">
                      <DayBadges days={classDays} />
                    </InfoRow>
                    <InfoRow label="주 수업횟수">
                      {student.weekly_count
                        ? `주 ${student.weekly_count}회`
                        : classDays.length > 0
                          ? `주 ${classDays.length}회`
                          : "-"}
                    </InfoRow>
                    <InfoRow label="시간대">
                      {student.time_slot
                        ? TIME_SLOT_LABELS[student.time_slot]
                        : "-"}
                    </InfoRow>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="수업료">
                      {formatKRW(student.monthly_tuition)}
                    </InfoRow>
                    <InfoRow label="할인율">
                      {student.discount_rate
                        ? `${student.discount_rate}%`
                        : "-"}
                    </InfoRow>
                    {student.discount_rate > 0 && student.discount_reason && (
                      <InfoRow label="할인사유">
                        {student.discount_reason}
                      </InfoRow>
                    )}
                    <InfoRow label="최종 수업료">
                      <span className="font-semibold text-blue-600">
                        {formatKRW(student.final_monthly_tuition)}
                      </span>
                    </InfoRow>
                    <InfoRow label="납부일">
                      {student.payment_due_day
                        ? `매월 ${student.payment_due_day}일`
                        : "-"}
                    </InfoRow>
                  </div>

                  {/* Trial info */}
                  {student.is_trial && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <InfoRow label="체험 잔여횟수">
                          {student.trial_remaining ?? "-"}회
                        </InfoRow>
                        {trialDates.length > 0 && (
                          <InfoRow label="체험 일정">
                            <div className="space-y-1">
                              {trialDates.map((td, i) => (
                                <div key={i} className="text-sm">
                                  {formatDate(td.date)}{" "}
                                  {TIME_SLOT_LABELS[td.time_slot] ?? td.time_slot}
                                  {td.attended !== undefined && (
                                    <Badge
                                      variant="secondary"
                                      className={`ml-2 ${td.attended ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"}`}
                                    >
                                      {td.attended ? "출석" : "미출석"}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </InfoRow>
                        )}
                      </div>
                    </>
                  )}

                  {/* Paused info */}
                  {student.status === "paused" && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <InfoRow label="휴원 시작일">
                          {student.rest_start_date
                            ? formatDate(student.rest_start_date)
                            : "-"}
                        </InfoRow>
                        <InfoRow label="휴원 종료일">
                          {student.rest_end_date
                            ? formatDate(student.rest_end_date)
                            : "-"}
                        </InfoRow>
                        {student.rest_reason && (
                          <InfoRow label="휴원 사유">
                            {student.rest_reason}
                          </InfoRow>
                        )}
                      </div>
                    </>
                  )}

                  <Separator className="my-3" />

                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="메모">
                      {student.memo ? (
                        <span className="whitespace-pre-wrap">
                          {student.memo}
                        </span>
                      ) : (
                        "-"
                      )}
                    </InfoRow>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-[140px_1fr] gap-x-4">
                    <InfoRow label="등록일">
                      {student.enrollment_date
                        ? formatDate(student.enrollment_date)
                        : formatDate(student.created_at)}
                    </InfoRow>
                    <InfoRow label="최종 수정일">
                      {student.updated_at
                        ? formatDate(student.updated_at)
                        : "-"}
                    </InfoRow>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status transition buttons - only visible when not editing */}
          {!editing && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>상태 변경</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {/* Trial -> Enroll */}
                  {student.status === "trial" && (
                    <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm">
                          정식 등록
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>정식 등록</DialogTitle>
                          <DialogDescription>
                            {student.name} 학생을 정식 등록 (재원)으로
                            전환하시겠습니까?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setEnrollOpen(false)}
                          >
                            취소
                          </Button>
                          <Button onClick={handleEnroll}>등록</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Active -> Pause */}
                  {student.status === "active" && (
                    <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          휴원
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>휴원 처리</DialogTitle>
                          <DialogDescription>
                            {student.name} 학생의 휴원 정보를 입력하세요.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>휴원 시작일 *</Label>
                            <Input
                              type="date"
                              value={pauseForm.rest_start_date}
                              onChange={(e) =>
                                setPauseForm({
                                  ...pauseForm,
                                  rest_start_date: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>휴원 종료일</Label>
                            <Input
                              type="date"
                              value={pauseForm.rest_end_date}
                              onChange={(e) =>
                                setPauseForm({
                                  ...pauseForm,
                                  rest_end_date: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>휴원 사유</Label>
                            <textarea
                              value={pauseForm.rest_reason}
                              onChange={(e) =>
                                setPauseForm({
                                  ...pauseForm,
                                  rest_reason: e.target.value,
                                })
                              }
                              rows={3}
                              className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                              placeholder="휴원 사유를 입력하세요"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setPauseOpen(false)}
                          >
                            취소
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handlePause}
                          >
                            휴원 처리
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Paused -> Resume */}
                  {student.status === "paused" && (
                    <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm">
                          복귀
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>복귀 처리</DialogTitle>
                          <DialogDescription>
                            {student.name} 학생을 재원 상태로 복귀시키겠습니까?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setResumeOpen(false)}
                          >
                            취소
                          </Button>
                          <Button onClick={handleResume}>복귀</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Active -> Graduate */}
                  {student.status === "active" && (
                    <Dialog
                      open={graduateOpen}
                      onOpenChange={setGraduateOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          졸업
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>졸업 처리</DialogTitle>
                          <DialogDescription>
                            {student.name} 학생을 졸업 처리하시겠습니까?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setGraduateOpen(false)}
                          >
                            취소
                          </Button>
                          <Button onClick={handleGraduate}>졸업 처리</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Any (except withdrawn/graduated) -> Withdraw */}
                  {student.status !== "withdrawn" &&
                    student.status !== "graduated" && (
                      <Dialog
                        open={withdrawOpen}
                        onOpenChange={setWithdrawOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-slate-500 hover:bg-slate-50"
                          >
                            퇴원
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>퇴원 처리</DialogTitle>
                            <DialogDescription>
                              {student.name} 학생을 퇴원 처리하시겠습니까?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <div>
                              <Label htmlFor="withdraw-reason">퇴원 사유</Label>
                              <textarea
                                id="withdraw-reason"
                                value={withdrawReason}
                                onChange={(e) => setWithdrawReason(e.target.value)}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                rows={3}
                                placeholder="퇴원 사유를 입력하세요 (선택)"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setWithdrawOpen(false);
                                setWithdrawReason("");
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleWithdraw}
                            >
                              퇴원 처리
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                  {/* No actions available */}
                  {(student.status === "withdrawn" ||
                    student.status === "graduated") && (
                    <p className="text-sm text-slate-400">
                      {STATUS_LABELS[student.status]} 상태에서는 상태 변경을 할
                      수 없습니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== PAYMENTS TAB ==================== */}
        <TabsContent value="payments">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>수납내역</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : payments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  수납 내역이 없습니다
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>수납월</TableHead>
                      <TableHead className="text-right">기본금액</TableHead>
                      <TableHead className="text-right">최종금액</TableHead>
                      <TableHead className="text-right">납부금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>납부일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.payment_month ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {formatKRW(p.base_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatKRW(p.final_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatKRW(p.paid_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              PAYMENT_STATUS_COLORS[p.status ?? "pending"] ??
                              "bg-slate-50 text-slate-500"
                            }
                          >
                            {PAYMENT_STATUS_LABELS[p.status ?? "pending"] ??
                              p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.paid_date ? formatDate(p.paid_date) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ATTENDANCE TAB ==================== */}
        <TabsContent value="attendance">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>출결현황</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : attendanceRecords.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  출결 기록이 없습니다
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((r, i) => (
                      <TableRow key={r.id ?? i}>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              ATTENDANCE_STATUS_COLORS[r.status] ??
                              "bg-slate-50 text-slate-500"
                            }
                          >
                            {ATTENDANCE_STATUS_LABELS[r.status] ?? r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TRAINING TAB ==================== */}
        <TabsContent value="training">
          {trainingLoading ? (
            <div className="mt-4 flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : radarData.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="py-8 text-center">
                <p className="mb-4 text-sm text-slate-400">
                  훈련 기록이 없습니다
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/training/records?student=${id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    훈련기록 페이지에서 입력
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-blue-500" />
                    종목별 최근 기록
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar
                        name="최근"
                        dataKey="latest"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="최고"
                        dataKey="best"
                        stroke="#16a34a"
                        fill="#16a34a"
                        fillOpacity={0.15}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex justify-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded bg-blue-500" />
                      최근 기록
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded bg-green-500" />
                      최고 기록
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              {trendData.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      기록 추이 (최근 20일)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        {trainingTypes
                          .filter((rt) => trainingRecords.some((r) => r.record_type_id === rt.id))
                          .map((rt, i) => (
                            <Line
                              key={rt.id}
                              type="monotone"
                              dataKey={rt.name}
                              stroke={TREND_COLORS[i % TREND_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              connectNulls
                            />
                          ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">종목별 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>종목</TableHead>
                        <TableHead className="text-right">최근</TableHead>
                        <TableHead className="text-right">최고</TableHead>
                        <TableHead className="text-right">측정횟수</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {radarData.map((d) => (
                        <TableRow key={d.type}>
                          <TableCell className="font-medium">{d.type}</TableCell>
                          <TableCell className="text-right">{d.latest}</TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {d.best}
                          </TableCell>
                          <TableCell className="text-right text-slate-500">
                            {d.count}회
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/training/records?student=${id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        전체 기록 보기
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ==================== CONSULTATIONS TAB ==================== */}
        <TabsContent value="consultations">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>상담이력</CardTitle>
            </CardHeader>
            <CardContent>
              {consultationsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : consultations.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  상담 기록이 없습니다
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>메모</TableHead>
                      <TableHead>담당자</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          {c.consultation_date
                            ? formatDate(c.consultation_date)
                            : "-"}
                        </TableCell>
                        <TableCell>{c.type ?? "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {c.content ?? "-"}
                        </TableCell>
                        <TableCell>{c.counselor ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
