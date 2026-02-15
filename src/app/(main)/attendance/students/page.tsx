"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { studentsAPI } from "@/lib/api/students";
import { attendanceAPI } from "@/lib/api/attendance";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-500",
  absent: "bg-red-500",
  late: "bg-amber-500",
  excused: "bg-slate-400",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "출석",
  absent: "결석",
  late: "지각",
  excused: "사유결석",
};

interface Student {
  id: number;
  name: string;
}

interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}

export default function AttendanceStudentsPage() {
  const [month, setMonth] = useState(new Date());
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await studentsAPI.list({ status: "active", search, limit: 50 });
      setStudents(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setStudents([]);
    }
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const monthStr = format(month, "yyyy-MM");
      const { data } = await attendanceAPI.byStudent(selectedStudent.id, { month: monthStr });
      setRecords(data.items ?? data ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, month]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  function changeMonth(delta: number) {
    setMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  const recordMap = new Map<string, AttendanceStatus>();
  records.forEach((r) => {
    recordMap.set(r.date, r.status);
  });

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">학생별 출결 현황</h1>
        <p className="text-sm text-slate-500">
          학생을 선택하여 월별 출결 현황을 확인합니다
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Student search */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">학생 검색</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="이름 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[400px] space-y-1 overflow-y-auto">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedStudent?.id === s.id
                      ? "bg-blue-50 font-medium text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {students.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">
                  검색 결과가 없습니다
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedStudent
                  ? `${selectedStudent.name} - 출결 현황`
                  : "학생을 선택하세요"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[120px] text-center text-sm font-medium">
                  {format(month, "yyyy년 M월", { locale: ko })}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <p className="py-12 text-center text-sm text-slate-400">
                왼쪽에서 학생을 선택하세요
              </p>
            ) : loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-4 flex gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-600">
                    출석 {presentCount}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-600">
                    결석 {absentCount}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-50 text-amber-600">
                    지각 {lateCount}
                  </Badge>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div
                      key={d}
                      className="py-2 text-center text-xs font-medium text-slate-500"
                    >
                      {d}
                    </div>
                  ))}
                  {/* Offset for first day */}
                  {Array.from({ length: days[0].getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const status = recordMap.get(dateStr);
                    return (
                      <div
                        key={dateStr}
                        className="flex flex-col items-center rounded-md border p-2"
                      >
                        <span className="text-xs text-slate-500">
                          {day.getDate()}
                        </span>
                        {status && (
                          <div
                            className={`mt-1 h-2 w-2 rounded-full ${STATUS_COLORS[status]}`}
                            title={STATUS_LABELS[status]}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  {(Object.keys(STATUS_COLORS) as AttendanceStatus[]).map(
                    (st) => (
                      <div key={st} className="flex items-center gap-1">
                        <div
                          className={`h-2 w-2 rounded-full ${STATUS_COLORS[st]}`}
                        />
                        {STATUS_LABELS[st]}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
