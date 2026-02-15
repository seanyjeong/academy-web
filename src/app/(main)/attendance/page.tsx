"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check, X, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { attendanceAPI } from "@/lib/api/attendance";
import { studentsAPI } from "@/lib/api/students";
import { Student, TIME_SLOT_LABELS } from "@/lib/types/student";

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

const ATTENDANCE_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  present: <Check className="h-4 w-4" />,
  absent: <X className="h-4 w-4" />,
  late: <Clock className="h-4 w-4" />,
  excused: <FileText className="h-4 w-4" />,
};

const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;

interface AttendanceRecord {
  student_id: number;
  status: AttendanceStatus;
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date());
  const [timeSlot, setTimeSlot] = useState<string>("morning");
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.allSettled([
        studentsAPI.list({ status: "active", limit: 100 }),
        attendanceAPI.list({ date: dateStr, time_slot: timeSlot }),
      ]);

      if (studentsRes.status === "fulfilled") {
        const data = studentsRes.value.data;
        const allStudents: Student[] = data.items ?? data ?? [];
        setStudents(
          allStudents.filter(
            (s) => !s.time_slot || s.time_slot === timeSlot
          )
        );
      }

      if (attendanceRes.status === "fulfilled") {
        const data = attendanceRes.value.data;
        const items: AttendanceRecord[] = data.items ?? data ?? [];
        const map: Record<number, AttendanceStatus> = {};
        items.forEach((r) => {
          map[r.student_id] = r.status;
        });
        setRecords(map);
      }
    } catch {
      // Load gracefully
    } finally {
      setLoading(false);
    }
  }, [dateStr, timeSlot]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const entries = Object.entries(records).map(([sid, status]) => ({
        student_id: Number(sid),
        status,
        date: dateStr,
        time_slot: timeSlot,
      }));
      await attendanceAPI.mark({ records: entries });
      toast.success("출결이 저장되었습니다");
    } catch {
      toast.error("출결 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">출결관리</h1>
          <p className="text-sm text-slate-500">
            일별 출결 현황을 관리합니다
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "출결 저장"}
        </Button>
      </div>

      {/* Date nav */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[140px] text-center">
          <span className="text-base font-semibold text-slate-900">
            {format(date, "yyyy년 M월 d일", { locale: ko })}
          </span>
          <span className="ml-2 text-sm text-slate-400">
            ({format(date, "EEEE", { locale: ko })})
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDate(new Date())}
          className="ml-2"
        >
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
              <CardHeader>
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
                  <div className="space-y-2">
                    {students.map((s) => {
                      const status = records[s.id];
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {s.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {s.school ?? ""} {s.grade ?? ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(
                              [
                                "present",
                                "absent",
                                "late",
                                "excused",
                              ] as AttendanceStatus[]
                            ).map((st) => (
                              <button
                                key={st}
                                onClick={() =>
                                  setRecords((prev) => ({
                                    ...prev,
                                    [s.id]: st,
                                  }))
                                }
                                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                  status === st
                                    ? ATTENDANCE_COLORS[st]
                                    : "text-slate-300 hover:text-slate-500"
                                }`}
                              >
                                {ATTENDANCE_ICONS[st]}
                                {ATTENDANCE_LABELS[st]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
