"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  UserCheck,
  Loader2,
  X,
  Copy,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { schedulesAPI } from "@/lib/api/schedules";
import { instructorsAPI } from "@/lib/api/instructors";
import { studentsAPI } from "@/lib/api/students";
import { DAY_LABELS, TIME_SLOT_LABELS } from "@/lib/types/student";
import type { TimeSlot } from "@/lib/types/student";

// ── Types ──

interface TrialDateEntry {
  date: string;
  time_slot: string;
  attended?: boolean;
}

interface Student {
  id: number;
  name: string;
  status: string;
  class_days?: number[] | string;
  time_slot?: string;
  is_trial?: boolean;
  trial_dates?: TrialDateEntry[] | string | null;
}

interface ScheduleRecord {
  id: number;
  class_date: string;
  time_slot: string;
  day_of_week?: string | null;
  title?: string;
  name?: string;
  instructor_id?: number | null;
  instructor_name?: string;
  attendance_taken?: boolean;
  is_closed?: boolean;
  student_count?: number;
}

interface InstructorOption {
  id: number;
  name: string;
  salary_type?: string;
}

interface AttendanceRecord {
  student_id: number;
  student_name: string;
  status: string | null;
}

// ── Constants ──

const SLOT_ORDER: TimeSlot[] = ["morning", "afternoon", "evening"];

const SLOT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  morning: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  afternoon: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  evening: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
};

// ── Helpers ──

function getCalendarDays(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function getDow(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function fmtDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseClassDays(raw: number[] | string | undefined): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Component ──

export default function SchedulesPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [loading, setLoading] = useState(true);

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  // Slot detail modal (attendance)
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>("morning");
  const [slotSchedule, setSlotSchedule] = useState<ScheduleRecord | null>(null);
  const [slotStudents, setSlotStudents] = useState<AttendanceRecord[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Instructor assignment panel (right sidebar)
  const [panelDate, setPanelDate] = useState<string | null>(null);
  const [panelAssignments, setPanelAssignments] = useState<Record<string, string>>({});
  const [savingPanel, setSavingPanel] = useState(false);
  const [applyingToWeekday, setApplyingToWeekday] = useState(false);

  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
  const weeks = useMemo(() => getCalendarDays(year, month), [year, month]);
  const daysInMonth = new Date(year, month, 0).getDate();

  // ── Data fetching ──

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [studRes, schedRes, instRes] = await Promise.all([
        studentsAPI.list({ limit: 1000 }),
        schedulesAPI.list(),
        instructorsAPI.list(),
      ]);
      const stuList = Array.isArray(studRes.data) ? studRes.data : studRes.data.items ?? [];
      setStudents(stuList.filter((s: Student) => s.status === "active" || s.status === "trial"));

      const schList = Array.isArray(schedRes.data) ? schedRes.data : schedRes.data.items ?? [];
      setSchedules(schList);

      const insList = Array.isArray(instRes.data) ? instRes.data : instRes.data.items ?? [];
      setInstructors(insList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Compute student counts per dow+slot (regular students) ──

  const studentsByDowSlot = useMemo(() => {
    const map: Record<number, Record<string, Student[]>> = {};
    for (let d = 0; d <= 6; d++) {
      map[d] = { morning: [], afternoon: [], evening: [] };
    }
    for (const s of students) {
      if (s.is_trial) continue; // trial students use specific dates
      const days = parseClassDays(s.class_days);
      const slot = s.time_slot || "morning";
      for (const d of days) {
        if (map[d] && map[d][slot]) {
          map[d][slot].push(s);
        }
      }
    }
    return map;
  }, [students]);

  // ── Compute trial students per specific date+slot ──

  const trialByDateSlot = useMemo(() => {
    const map: Record<string, Student[]> = {};
    for (const s of students) {
      if (!s.is_trial) continue;
      let dates: TrialDateEntry[] = [];
      if (typeof s.trial_dates === "string") {
        try { dates = JSON.parse(s.trial_dates); } catch { /* ignore */ }
      } else if (Array.isArray(s.trial_dates)) {
        dates = s.trial_dates;
      }
      for (const td of dates) {
        const key = `${td.date}|${td.time_slot}`;
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
      // Fallback: trial student with class_days but no trial_dates
      if (dates.length === 0) {
        const days = parseClassDays(s.class_days);
        const slot = s.time_slot || "morning";
        for (let d = 1; d <= daysInMonth; d++) {
          const dow = getDow(year, month, d);
          if (!days.includes(dow)) continue;
          const key = `${fmtDate(year, month, d)}|${slot}`;
          if (!map[key]) map[key] = [];
          map[key].push(s);
        }
      }
    }
    return map;
  }, [students, year, month, daysInMonth]);

  // ── Helper: get all students for a specific date+slot ──

  function getStudentsForDateSlot(dateStr: string, slot: string): Student[] {
    const dow = new Date(dateStr).getDay();
    const regular = studentsByDowSlot[dow]?.[slot] ?? [];
    const trial = trialByDateSlot[`${dateStr}|${slot}`] ?? [];
    return [...regular, ...trial];
  }

  // ── Map schedules by date+slot for quick lookup ──

  const scheduleByDateSlot = useMemo(() => {
    const map: Record<string, ScheduleRecord> = {};
    for (const s of schedules) {
      if (s.class_date && s.class_date.startsWith(yearMonth)) {
        const key = `${s.class_date}|${s.time_slot}`;
        map[key] = s;
      }
    }
    return map;
  }, [schedules, yearMonth]);

  // ── Instructor assignments per date from schedule data ──

  const instructorByDateSlot = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const s of schedules) {
      if (s.class_date && s.class_date.startsWith(yearMonth) && s.instructor_id) {
        map[`${s.class_date}|${s.time_slot}`] = s.instructor_id;
      }
    }
    return map;
  }, [schedules, yearMonth]);

  const instructorMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const inst of instructors) {
      map[inst.id] = inst.name;
    }
    return map;
  }, [instructors]);

  // ── Month navigation ──

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    else if (m > 12) { m = 1; y += 1; }
    setYear(y);
    setMonth(m);
    setPanelDate(null);
  }

  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();

  // ── Ensure a ClassSchedule record exists for date+slot, return its id ──

  async function ensureScheduleRecord(dateStr: string, slot: TimeSlot): Promise<ScheduleRecord> {
    const key = `${dateStr}|${slot}`;
    const existing = scheduleByDateSlot[key];
    if (existing) return existing;

    const { data } = await schedulesAPI.create({
      class_date: dateStr,
      time_slot: slot,
      name: `${TIME_SLOT_LABELS[slot]}반`,
    });
    return data;
  }

  // ── Date click → open instructor panel ──

  function handleDateClick(day: number) {
    const dateStr = fmtDate(year, month, day);
    setPanelDate(dateStr);

    // Load current instructor assignments from schedule data
    const assignments: Record<string, string> = {};
    for (const slot of SLOT_ORDER) {
      const key = `${dateStr}|${slot}`;
      const sched = scheduleByDateSlot[key];
      assignments[slot] = sched?.instructor_id ? String(sched.instructor_id) : "none";
    }
    setPanelAssignments(assignments);
  }

  // ── Save instructor assignments for panel date ──

  async function handleSavePanelAssignments() {
    if (!panelDate) return;
    setSavingPanel(true);
    try {
      for (const slot of SLOT_ORDER) {
        const instId = panelAssignments[slot];
        const key = `${panelDate}|${slot}`;
        const sched = scheduleByDateSlot[key];
        const newInstId = instId === "none" ? null : Number(instId);

        if (sched) {
          // Update existing schedule record
          if (sched.instructor_id !== newInstId) {
            await schedulesAPI.update(sched.id, { instructor_id: newInstId });
          }
        } else if (newInstId) {
          // Create new schedule record with instructor
          await schedulesAPI.create({
            class_date: panelDate,
            time_slot: slot,
            name: `${TIME_SLOT_LABELS[slot]}반`,
            instructor_id: newInstId,
          });
        }
      }
      toast.success("강사 배정이 저장되었습니다");
      await fetchAll();
    } catch {
      toast.error("강사 배정에 실패했습니다");
    } finally {
      setSavingPanel(false);
    }
  }

  // ── Copy assignments to all same weekdays in month ──

  async function handleApplyToWeekday() {
    if (!panelDate) return;
    const panelDow = new Date(panelDate).getDay();

    setApplyingToWeekday(true);
    try {
      let updated = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dow = getDow(year, month, d);
        if (dow !== panelDow) continue;

        const dateStr = fmtDate(year, month, d);
        if (dateStr === panelDate) continue; // skip the source date

        for (const slot of SLOT_ORDER) {
          const instId = panelAssignments[slot];
          const newInstId = instId === "none" ? null : Number(instId);
          const key = `${dateStr}|${slot}`;
          const sched = scheduleByDateSlot[key];

          if (sched) {
            if (sched.instructor_id !== newInstId) {
              await schedulesAPI.update(sched.id, { instructor_id: newInstId });
              updated++;
            }
          } else if (newInstId) {
            await schedulesAPI.create({
              class_date: dateStr,
              time_slot: slot,
              name: `${TIME_SLOT_LABELS[slot]}반`,
              instructor_id: newInstId,
            });
            updated++;
          }
        }
      }
      if (updated > 0) {
        toast.success(`같은 요일 ${updated}건에 적용되었습니다`);
        await fetchAll();
      } else {
        toast.info("변경할 내용이 없습니다");
      }
    } catch {
      toast.error("일괄 적용에 실패했습니다");
    } finally {
      setApplyingToWeekday(false);
    }
  }

  // ── Slot click → open attendance modal ──

  async function handleSlotClick(e: React.MouseEvent, dateStr: string, slot: TimeSlot) {
    e.stopPropagation(); // don't trigger date click
    setSelectedDate(dateStr);
    setSelectedSlot(slot);
    setSlotModalOpen(true);
    setSlotStudents([]);
    setAttendanceMap({});
    setSlotSchedule(null);

    const key = `${dateStr}|${slot}`;
    const sched = scheduleByDateSlot[key] ?? null;
    setSlotSchedule(sched);

    // Build student list from data (always up-to-date)
    const allStuds = getStudentsForDateSlot(dateStr, slot);
    const fallbackList = allStuds.map((s) => ({
      student_id: s.id,
      student_name: s.name,
      status: null,
    }));

    // Load attendance if schedule record exists
    if (sched) {
      try {
        const { data } = await schedulesAPI.attendance(sched.id);
        const list: AttendanceRecord[] = data.students ?? data ?? [];
        // Merge: attendance records + any new students not yet in attendance
        const attendedIds = new Set(list.map((a) => a.student_id));
        const merged = [
          ...list,
          ...fallbackList.filter((s) => !attendedIds.has(s.student_id)),
        ];
        setSlotStudents(merged);
        const map: Record<number, string> = {};
        for (const a of list) {
          if (a.status) map[a.student_id] = a.status;
        }
        setAttendanceMap(map);
      } catch {
        setSlotStudents(fallbackList);
      }
    } else {
      const studs = allStuds;
      setSlotStudents(studs.map((s) => ({ student_id: s.id, student_name: s.name, status: null })));
    }
  }

  // ── Attendance helpers ──

  function toggleAttendance(studentId: number, status: string) {
    setAttendanceMap((prev) => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  }

  function markAllPresent() {
    const map: Record<number, string> = {};
    for (const s of slotStudents) {
      map[s.student_id] = "present";
    }
    setAttendanceMap(map);
  }

  async function handleSaveAttendance() {
    setSavingAttendance(true);
    try {
      // Auto-create schedule record if it doesn't exist
      let sched = slotSchedule;
      if (!sched) {
        const { data } = await schedulesAPI.create({
          class_date: selectedDate,
          time_slot: selectedSlot,
          name: `${TIME_SLOT_LABELS[selectedSlot]}반`,
        });
        sched = data;
        setSlotSchedule(data);
      }

      const records = slotStudents.map((s) => ({
        student_id: s.student_id,
        status: attendanceMap[s.student_id] ?? "present",
      }));
      await schedulesAPI.markAttendance(sched!.id, { records });
      toast.success("출석이 저장되었습니다");
      fetchAll();
    } catch {
      toast.error("출석 저장에 실패했습니다");
    } finally {
      setSavingAttendance(false);
    }
  }

  // ── Render helpers ──

  const selectedDow = selectedDate ? new Date(selectedDate).getDay() : 0;
  const selectedDayLabel = selectedDate
    ? `${selectedDate.replace(/-/g, ".")} (${DAY_LABELS[selectedDow]})`
    : "";

  const panelDow = panelDate ? new Date(panelDate).getDay() : 0;
  const panelDayLabel = panelDate
    ? `${panelDate.replace(/-/g, ".")} (${DAY_LABELS[panelDow]})`
    : "";

  // Count how many dates have instructors assigned
  const assignedDayCount = useMemo(() => {
    const datesWithInstructor = new Set<string>();
    for (const key of Object.keys(instructorByDateSlot)) {
      const date = key.split("|")[0];
      datesWithInstructor.add(date);
    }
    return datesWithInstructor.size;
  }, [instructorByDateSlot]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수업 일정</h1>
          <p className="text-sm text-slate-500">
            날짜를 클릭하여 강사를 배정하세요 &middot; 시간대를 클릭하면 출석부가 열립니다
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <UserCheck className="mr-1 h-3 w-3" />
          강사 배정 {assignedDayCount}일
        </Badge>
      </div>

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[120px] text-center text-lg font-semibold text-slate-900">
          {year}년 {month}월
        </span>
        <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main layout: Calendar + Panel */}
      <div className="flex gap-4">
        {/* Calendar */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* Day header */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className={`py-2 text-center text-xs font-medium ${
                      i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                  {week.map((day, di) => {
                    if (day === null) {
                      return <div key={di} className="min-h-[90px] bg-slate-50/50" />;
                    }
                    const dateStr = fmtDate(year, month, day);
                    const dow = getDow(year, month, day);
                    const todayClass = isToday(day);
                    const isPanelActive = panelDate === dateStr;

                    // Count assigned instructors for this date
                    const assignedSlots = SLOT_ORDER.filter(
                      (s) => instructorByDateSlot[`${dateStr}|${s}`]
                    ).length;

                    return (
                      <div
                        key={di}
                        onClick={() => handleDateClick(day)}
                        className={`min-h-[90px] cursor-pointer border-r border-slate-100 p-1 transition-colors last:border-r-0 ${
                          isPanelActive
                            ? "bg-violet-50 ring-2 ring-inset ring-violet-300"
                            : todayClass
                              ? "bg-blue-50/50 hover:bg-blue-50"
                              : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="mb-0.5 flex items-center justify-between">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
                              todayClass
                                ? "bg-blue-600 text-white"
                                : di === 0
                                  ? "text-red-500"
                                  : di === 6
                                    ? "text-blue-500"
                                    : "text-slate-700"
                            }`}
                          >
                            {day}
                          </span>
                          {assignedSlots > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-medium text-violet-600">
                              <UserCheck className="h-2.5 w-2.5" />
                              {assignedSlots}
                            </span>
                          )}
                        </div>
                        {/* 3 time slots */}
                        <div className="space-y-0.5">
                          {SLOT_ORDER.map((slot) => {
                            const slotStudents = getStudentsForDateSlot(dateStr, slot);
                            const stuCount = slotStudents.length;
                            const hasTrial = slotStudents.some((s) => s.is_trial);
                            if (stuCount === 0) return null;

                            const key = `${dateStr}|${slot}`;
                            const sched = scheduleByDateSlot[key];
                            const colors = SLOT_COLORS[slot];
                            const hasInstructor = sched?.instructor_id != null;
                            const attended = sched?.attendance_taken;
                            const instName = sched?.instructor_id
                              ? instructorMap[sched.instructor_id]
                              : null;

                            return (
                              <button
                                key={slot}
                                onClick={(e) => handleSlotClick(e, dateStr, slot)}
                                className={`flex w-full items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-tight transition-colors hover:ring-1 hover:ring-slate-300 ${
                                  attended
                                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                    : `${colors.bg} ${colors.text}`
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                                <span className="truncate font-medium">
                                  {instName ? instName : TIME_SLOT_LABELS[slot]}
                                </span>
                                <span className="ml-auto flex shrink-0 items-center gap-0.5">
                                  <Users className="h-2.5 w-2.5" />
                                  {stuCount}
                                  {hasTrial && (
                                    <span className="text-[8px] text-pink-500" title="체험학생 포함">T</span>
                                  )}
                                </span>
                                {attended && (
                                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {SLOT_ORDER.map((slot) => (
              <div key={slot} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${SLOT_COLORS[slot].dot}`} />
                {TIME_SLOT_LABELS[slot]}
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3 w-3 text-violet-500" />
              강사 배정
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              출석 완료
            </div>
          </div>
        </div>

        {/* ── Instructor Assignment Panel (Right Sidebar) ── */}
        {panelDate && (
          <div className="w-72 shrink-0 xl:w-80">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">강사 배정</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPanelDate(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm font-medium text-slate-600">{panelDayLabel}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Time slot sections */}
                {SLOT_ORDER.map((slot) => {
                  const colors = SLOT_COLORS[slot];
                  const stuCount = getStudentsForDateSlot(panelDate, slot).length;
                  const currentInstId = panelAssignments[slot] ?? "none";

                  return (
                    <div key={slot} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                          <span className="text-sm font-medium text-slate-700">
                            {TIME_SLOT_LABELS[slot]}
                          </span>
                        </div>
                        {stuCount > 0 && (
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            <Users className="mr-0.5 h-2.5 w-2.5" />
                            {stuCount}명
                          </Badge>
                        )}
                      </div>
                      <Select
                        value={currentInstId}
                        onValueChange={(v) =>
                          setPanelAssignments((prev) => ({ ...prev, [slot]: v }))
                        }
                      >
                        <SelectTrigger
                          className={`w-full ${
                            currentInstId !== "none"
                              ? "border-violet-200 bg-violet-50 text-violet-700"
                              : ""
                          }`}
                        >
                          <SelectValue placeholder="강사 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">미배정</SelectItem>
                          {instructors.map((inst) => (
                            <SelectItem key={inst.id} value={String(inst.id)}>
                              {inst.name}
                              {inst.salary_type && (
                                <span className="ml-1 text-xs text-slate-400">
                                  ({inst.salary_type === "hourly"
                                    ? "시급"
                                    : inst.salary_type === "per_class"
                                      ? "건당"
                                      : inst.salary_type === "monthly"
                                        ? "월급"
                                        : "혼합"})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}

                {/* Action buttons */}
                <div className="space-y-2 border-t pt-3">
                  <Button
                    onClick={handleSavePanelAssignments}
                    disabled={savingPanel}
                    className="w-full"
                  >
                    {savingPanel ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {savingPanel ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleApplyToWeekday}
                    disabled={applyingToWeekday}
                    className="w-full"
                  >
                    {applyingToWeekday ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {applyingToWeekday
                      ? "적용 중..."
                      : `이번달 모든 ${DAY_LABELS[panelDow]}요일에 적용`}
                  </Button>
                </div>

                {/* Current month instructor summary */}
                <div className="border-t pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">이번달 배정 현황</p>
                  <div className="space-y-1">
                    {instructors.map((inst) => {
                      const count = Object.entries(instructorByDateSlot).filter(
                        ([, id]) => id === inst.id
                      ).length;
                      if (count === 0) return null;
                      return (
                        <div
                          key={inst.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-600">{inst.name}</span>
                          <span className="font-medium text-slate-800">{count}건</span>
                        </div>
                      );
                    })}
                    {Object.keys(instructorByDateSlot).length === 0 && (
                      <p className="text-xs text-slate-400">아직 배정된 강사가 없습니다</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Attendance Modal ── */}
      <Dialog open={slotModalOpen} onOpenChange={setSlotModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${SLOT_COLORS[selectedSlot]?.dot}`} />
              {selectedDayLabel} {TIME_SLOT_LABELS[selectedSlot]}반
              <Badge variant="secondary" className="ml-auto text-xs">
                {slotStudents.length}명
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student attendance list */}
            {slotStudents.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                이 시간대에 등록된 학생이 없습니다
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">출석부</span>
                  <Button variant="outline" size="sm" onClick={markAllPresent}>
                    전체 출석
                  </Button>
                </div>
                <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-md border p-2">
                  {slotStudents.map((s) => {
                    const curStatus = attendanceMap[s.student_id];
                    return (
                      <div
                        key={s.student_id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                          {s.student_name}
                        </span>
                        <div className="flex shrink-0 gap-1">
                          {(
                            [
                              { key: "present", label: "출석", color: "bg-green-500" },
                              { key: "absent", label: "결석", color: "bg-red-500" },
                              { key: "late", label: "지각", color: "bg-amber-500" },
                              { key: "excused", label: "공결", color: "bg-slate-400" },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => toggleAttendance(s.student_id, opt.key)}
                              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                curStatus === opt.key
                                  ? `${opt.color} text-white`
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotModalOpen(false)}>
              닫기
            </Button>
            {slotStudents.length > 0 && (
              <Button onClick={handleSaveAttendance} disabled={savingAttendance}>
                {savingAttendance ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "출석 저장"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
