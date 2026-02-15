"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { schedulesAPI } from "@/lib/api/schedules";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "출석",
  absent: "결석",
  late: "지각",
  excused: "사유결석",
};

const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-50 text-green-600",
  absent: "bg-red-50 text-red-600",
  late: "bg-amber-50 text-amber-600",
  excused: "bg-slate-100 text-slate-500",
};

interface ScheduleInfo {
  id: number;
  name: string;
  time_slot: string;
}

interface StudentAttendance {
  student_id: number;
  student_name: string;
  status?: AttendanceStatus;
}

export default function ScheduleAttendancePage() {
  const params = useParams();
  const scheduleId = Number(params.id);

  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [date, setDate] = useState(new Date());
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleRes, attendanceRes] = await Promise.allSettled([
        schedulesAPI.get(scheduleId),
        schedulesAPI.attendance(scheduleId, dateStr),
      ]);

      if (scheduleRes.status === "fulfilled") {
        setSchedule(scheduleRes.value.data);
      }

      if (attendanceRes.status === "fulfilled") {
        const data = attendanceRes.value.data;
        setStudents(data.students ?? data.items ?? data ?? []);
      }
    } catch {
      // Load gracefully
    } finally {
      setLoading(false);
    }
  }, [scheduleId, dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  }

  function setStatus(studentId: number, status: AttendanceStatus) {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, status } : s
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records = students
        .filter((s) => s.status)
        .map((s) => ({
          student_id: s.student_id,
          status: s.status,
        }));
      await schedulesAPI.markAttendance(scheduleId, {
        date: dateStr,
        records,
      });
      toast.success("출결이 저장되었습니다");
    } catch {
      toast.error("출결 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/schedules">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">
            {schedule?.name ?? "수업"} 출결
          </h1>
          <p className="text-sm text-slate-500">수업별 출결을 체크합니다</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      {/* Date nav */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[140px] text-center text-base font-semibold text-slate-900">
          {format(date, "yyyy년 M월 d일", { locale: ko })}
        </span>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDate(new Date())}
        >
          오늘
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            학생 목록 ({students.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              이 수업에 배정된 학생이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <div
                  key={s.student_id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {s.student_name}
                  </p>
                  <div className="flex items-center gap-2">
                    {(
                      ["present", "absent", "late", "excused"] as AttendanceStatus[]
                    ).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(s.student_id, st)}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          s.status === st
                            ? ATTENDANCE_COLORS[st]
                            : "text-slate-300 hover:text-slate-500"
                        }`}
                      >
                        {st === "present" && <Check className="h-3.5 w-3.5" />}
                        {st === "absent" && <X className="h-3.5 w-3.5" />}
                        {st === "late" && <Clock className="h-3.5 w-3.5" />}
                        {st === "excused" && (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        {ATTENDANCE_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
