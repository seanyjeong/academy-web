"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attendanceAPI } from "@/lib/api/attendance";
import { studentsAPI } from "@/lib/api/students";
import type { Student } from "@/lib/types/student";
import { TIME_SLOT_LABELS } from "@/lib/types/student";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const ATTENDANCE_STATUS: Record<
  AttendanceStatus,
  { label: string; color: string; hoverColor: string }
> = {
  present: {
    label: "출석",
    color: "bg-blue-500 text-white",
    hoverColor: "hover:bg-blue-600",
  },
  absent: {
    label: "결석",
    color: "bg-red-500 text-white",
    hoverColor: "hover:bg-red-600",
  },
  late: {
    label: "지각",
    color: "bg-amber-500 text-white",
    hoverColor: "hover:bg-amber-600",
  },
  excused: {
    label: "사유",
    color: "bg-orange-500 text-white",
    hoverColor: "hover:bg-orange-600",
  },
};

const ABSENCE_REASONS = [
  { value: "illness", label: "질병" },
  { value: "school_exam", label: "학교시험" },
  { value: "personal", label: "개인사정" },
  { value: "other", label: "기타" },
];

const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;

interface AttendanceRecord {
  student_id: number;
  student_name: string;
  grade?: string;
  status: AttendanceStatus | null;
  reason?: string;
}

interface AttendanceState {
  status: AttendanceStatus | null;
  reason?: string;
}

interface MonthlySummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState<string>("morning");
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<number, AttendanceState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);

  const dateObj = useMemo(() => new Date(selectedDate + "T00:00:00"), [selectedDate]);
  const yearMonth = selectedDate.slice(0, 7);

  const changeDate = useCallback(
    (delta: number) => {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + delta);
      setSelectedDate(d.toISOString().split("T")[0]);
    },
    [dateObj]
  );

  const goToToday = useCallback(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.allSettled([
        studentsAPI.list({ status: "active", limit: 200 }),
        attendanceAPI.list({ date: selectedDate, time_slot: timeSlot }),
      ]);

      if (studentsRes.status === "fulfilled") {
        const data = studentsRes.value.data;
        const allStudents: Student[] = data.items ?? data ?? [];
        setStudents(
          allStudents.filter((s) => !s.time_slot || s.time_slot === timeSlot)
        );
      }

      if (attendanceRes.status === "fulfilled") {
        const data = attendanceRes.value.data;
        const items: { student_id: number; status: AttendanceStatus; reason?: string }[] =
          data.items ?? data ?? [];
        const map: Record<number, AttendanceState> = {};
        items.forEach((r) => {
          map[r.student_id] = { status: r.status, reason: r.reason };
        });
        setRecords(map);
      } else {
        setRecords({});
      }
    } catch {
      // Load gracefully
    } finally {
      setLoading(false);
    }
  }, [selectedDate, timeSlot]);

  // Fetch monthly summary
  const fetchMonthlySummary = useCallback(async () => {
    try {
      const [yearStr, monthStr] = yearMonth.split("-");
      const { data } = await attendanceAPI.monthlySummary(
        Number(yearStr),
        Number(monthStr)
      );
      if (data.counts) {
        setMonthlySummary(data.counts);
      }
    } catch {
      setMonthlySummary(null);
    }
  }, [yearMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchMonthlySummary();
  }, [fetchMonthlySummary]);

  function setStudentStatus(studentId: number, status: AttendanceStatus) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status === status ? null : status,
        reason: status !== "excused" ? undefined : prev[studentId]?.reason,
      },
    }));
  }

  function setStudentReason(studentId: number, reason: string) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status: "excused", reason },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const entries = Object.entries(records)
        .filter(([, state]) => state.status !== null)
        .map(([sid, state]) => ({
          student_id: Number(sid),
          status: state.status!,
          date: selectedDate,
          time_slot: timeSlot,
        }));

      if (entries.length === 0) {
        toast.error("저장할 출결 기록이 없습니다");
        setSaving(false);
        return;
      }

      await attendanceAPI.mark({ records: entries });
      toast.success("출결이 저장되었습니다");
      fetchMonthlySummary();
    } catch {
      toast.error("출결 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  // Stats for current view
  const viewStats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(records).forEach((state) => {
      if (state.status && state.status in counts) {
        counts[state.status as AttendanceStatus]++;
      }
    });
    return counts;
  }, [records]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">출결관리</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "저장 중..." : "출결 저장"}
        </Button>
      </div>

      {/* Date navigation */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[160px] text-center">
          <span className="text-base font-semibold text-slate-900">
            {format(dateObj, "yyyy년 M월 d일", { locale: ko })}
          </span>
          <span className="ml-2 text-sm text-slate-400">
            ({format(dateObj, "EEEE", { locale: ko })})
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2">
          오늘
        </Button>
      </div>

      {/* Time slot tabs */}
      <Tabs value={timeSlot} onValueChange={setTimeSlot}>
        <TabsList>
          {TIME_SLOTS.map((slot) => (
            <TabsTrigger key={slot} value={slot}>
              {TIME_SLOT_LABELS[slot]}반
            </TabsTrigger>
          ))}
        </TabsList>

        {TIME_SLOTS.map((slot) => (
          <TabsContent key={slot} value={slot}>
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {TIME_SLOT_LABELS[slot]}반 학생 ({students.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : students.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    해당 시간대 학생이 없습니다
                  </p>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="mb-2 hidden grid-cols-[1fr_80px_auto_120px] items-center gap-4 border-b border-slate-100 px-4 pb-2 text-xs font-medium text-slate-500 sm:grid">
                      <span>이름</span>
                      <span>학년</span>
                      <span>출석상태</span>
                      <span>사유</span>
                    </div>

                    {/* Student rows */}
                    <div className="space-y-2">
                      {students.map((s) => {
                        const state = records[s.id] ?? { status: null };
                        return (
                          <div
                            key={s.id}
                            className="flex flex-col gap-2 rounded-lg border border-slate-200 px-4 py-3 sm:grid sm:grid-cols-[1fr_80px_auto_120px] sm:items-center sm:gap-4"
                          >
                            {/* Name */}
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {s.name}
                              </p>
                              <p className="text-xs text-slate-400 sm:hidden">
                                {s.grade ?? ""}
                              </p>
                            </div>

                            {/* Grade */}
                            <div className="hidden text-sm text-slate-600 sm:block">
                              {s.grade ?? "-"}
                            </div>

                            {/* Status buttons */}
                            <div className="flex items-center gap-1.5">
                              {(
                                Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]
                              ).map((st) => {
                                const isActive = state.status === st;
                                const config = ATTENDANCE_STATUS[st];
                                return (
                                  <button
                                    key={st}
                                    onClick={() => setStudentStatus(s.id, st)}
                                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                      isActive
                                        ? config.color
                                        : `bg-slate-100 text-slate-400 ${config.hoverColor} hover:text-white`
                                    }`}
                                  >
                                    {config.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Reason select (shown when excused) */}
                            <div className="min-w-[120px]">
                              {state.status === "excused" ? (
                                <Select
                                  value={state.reason ?? ""}
                                  onValueChange={(v) => setStudentReason(s.id, v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="사유 선택" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ABSENCE_REASONS.map((r) => (
                                      <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-slate-300">-</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Stats summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-blue-600">
              {monthlySummary?.present ?? viewStats.present}
            </span>
            <span className="mt-1 text-xs text-slate-500">출석일</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-red-600">
              {monthlySummary?.absent ?? viewStats.absent}
            </span>
            <span className="mt-1 text-xs text-slate-500">결석</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-amber-600">
              {monthlySummary?.late ?? viewStats.late}
            </span>
            <span className="mt-1 text-xs text-slate-500">지각</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-orange-600">
              {monthlySummary?.excused ?? viewStats.excused}
            </span>
            <span className="mt-1 text-xs text-slate-500">사유결석</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
