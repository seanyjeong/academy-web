"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Clock, Users, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { schedulesAPI } from "@/lib/api/schedules";
import { DAY_LABELS, TIME_SLOT_LABELS } from "@/lib/types/student";
import type { TimeSlot } from "@/lib/types/student";

interface Schedule {
  id: number;
  name: string;
  title?: string;
  time_slot: string;
  day_of_week: string | null;
  days?: string[];
  class_date: string;
  start_time?: string;
  end_time?: string;
  instructor_name?: string;
  instructor_id?: number;
  student_count?: number;
  attendance_taken?: boolean;
  is_closed?: boolean;
  close_reason?: string;
  capacity?: number;
  has_makeup?: boolean;
}

const TIME_SLOT_COLORS: Record<string, string> = {
  morning: "bg-blue-500",
  afternoon: "bg-green-500",
  evening: "bg-orange-500",
};

const TIME_SLOT_RING_COLORS: Record<string, string> = {
  morning: "ring-blue-200 bg-blue-50 text-blue-700",
  afternoon: "ring-green-200 bg-green-50 text-green-700",
  evening: "ring-orange-200 bg-orange-50 text-orange-700",
};

const DAY_OF_WEEK_MAP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

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

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function SchedulesPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    time_slot: "morning",
    day_of_week: "mon",
    start_time: "",
    end_time: "",
    instructor_name: "",
  });

  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
  const weeks = useMemo(() => getCalendarDays(year, month), [year, month]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await schedulesAPI.list();
      const items: Schedule[] = data.items ?? data ?? [];
      setSchedules(items);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Map schedules to calendar dates
  // Schedules have class_date (specific date) or day_of_week (recurring weekly)
  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    for (const schedule of schedules) {
      if (schedule.class_date && schedule.class_date.startsWith(yearMonth)) {
        // Specific date schedule
        if (!map[schedule.class_date]) map[schedule.class_date] = [];
        map[schedule.class_date].push(schedule);
      } else if (schedule.day_of_week || (schedule.days && schedule.days.length > 0)) {
        // Recurring schedule - map to all matching days in the month
        const dayKeys = schedule.days && schedule.days.length > 0
          ? schedule.days
          : schedule.day_of_week
            ? [schedule.day_of_week]
            : [];

        for (const dayKey of dayKeys) {
          const targetDow = DAY_OF_WEEK_MAP[dayKey];
          if (targetDow === undefined) continue;

          for (let d = 1; d <= daysInMonth; d++) {
            if (getDayOfWeek(year, month, d) === targetDow) {
              const dateStr = formatDateStr(year, month, d);
              if (!map[dateStr]) map[dateStr] = [];
              // Avoid duplicates
              if (!map[dateStr].some((s) => s.id === schedule.id)) {
                map[dateStr].push(schedule);
              }
            }
          }
        }
      }
    }
    return map;
  }, [schedules, year, month, yearMonth]);

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
  }

  function handleDayClick(day: number) {
    setSelectedDay(day);
    setDayDetailOpen(true);
  }

  function openCreateFromDay() {
    if (selectedDay !== null) {
      const dow = getDayOfWeek(year, month, selectedDay);
      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      setForm((prev) => ({ ...prev, day_of_week: dayKeys[dow] }));
    }
    setDayDetailOpen(false);
    setCreateOpen(true);
  }

  async function handleCreate() {
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        time_slot: form.time_slot,
        day_of_week: form.day_of_week,
      };
      if (form.start_time) payload.start_time = form.start_time;
      if (form.end_time) payload.end_time = form.end_time;

      await schedulesAPI.create(payload);
      toast.success("수업이 등록되었습니다");
      setCreateOpen(false);
      setForm({
        name: "",
        time_slot: "morning",
        day_of_week: "mon",
        start_time: "",
        end_time: "",
        instructor_name: "",
      });
      fetchSchedules();
    } catch {
      toast.error("수업 등록에 실패했습니다");
    }
  }

  const selectedDateStr = selectedDay ? formatDateStr(year, month, selectedDay) : "";
  const selectedDaySchedules = selectedDateStr ? (schedulesByDate[selectedDateStr] ?? []) : [];

  // Group selected day schedules by time_slot
  const groupedBySlot = useMemo(() => {
    const groups: Record<string, Schedule[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const s of selectedDaySchedules) {
      const slot = s.time_slot || "morning";
      if (!groups[slot]) groups[slot] = [];
      groups[slot].push(s);
    }
    return groups;
  }, [selectedDaySchedules]);

  const isToday = (day: number) => {
    return year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">수업 일정</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              수업 등록
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>수업 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>수업 이름</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 초등 오전반"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시간대</Label>
                  <Select
                    value={form.time_slot}
                    onValueChange={(v) => setForm({ ...form, time_slot: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">오전</SelectItem>
                      <SelectItem value="afternoon">오후</SelectItem>
                      <SelectItem value="evening">저녁</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>요일</Label>
                  <Select
                    value={form.day_of_week}
                    onValueChange={(v) => setForm({ ...form, day_of_week: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["mon", "tue", "wed", "thu", "fri", "sat"].map((key) => (
                        <SelectItem key={key} value={key}>
                          {DAY_LABELS[DAY_OF_WEEK_MAP[key]]}요일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>강사 (선택)</Label>
                <Input
                  value={form.instructor_name}
                  onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
                  placeholder="강사명 입력"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={!form.name}>
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Calendar grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          {/* Day of week header */}
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
                  return <div key={di} className="min-h-[80px] bg-slate-50/50" />;
                }
                const dateStr = formatDateStr(year, month, day);
                const daySchedules = schedulesByDate[dateStr] ?? [];
                const hasSchedules = daySchedules.length > 0;
                const todayClass = isToday(day);

                // Collect unique time slots
                const timeSlots = [...new Set(daySchedules.map((s) => s.time_slot))];

                return (
                  <button
                    key={di}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[80px] border-r border-slate-100 p-1.5 text-left transition-colors last:border-r-0 hover:bg-slate-50 ${
                      todayClass ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
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
                    {hasSchedules && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {timeSlots.map((slot) => (
                          <span
                            key={slot}
                            className={`h-2 w-2 rounded-full ${TIME_SLOT_COLORS[slot] ?? "bg-slate-400"}`}
                            title={TIME_SLOT_LABELS[slot as TimeSlot] ?? slot}
                          />
                        ))}
                      </div>
                    )}
                    {hasSchedules && (
                      <div className="mt-0.5">
                        {daySchedules.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className={`mt-0.5 truncate rounded px-1 text-[10px] leading-tight ${
                              TIME_SLOT_RING_COLORS[s.time_slot] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.name}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            +{daySchedules.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          오전
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          오후
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          저녁
        </div>
      </div>

      {/* Day detail dialog */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${year}년 ${month}월 ${selectedDay}일`}{" "}
              {selectedDay && (
                <span className="text-sm font-normal text-slate-400">
                  ({DAY_LABELS[getDayOfWeek(year, month, selectedDay)]})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDaySchedules.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                등록된 수업이 없습니다
              </p>
            ) : (
              (["morning", "afternoon", "evening"] as const).map((slot) => {
                const slotSchedules = groupedBySlot[slot];
                if (!slotSchedules || slotSchedules.length === 0) return null;
                return (
                  <div key={slot}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${TIME_SLOT_COLORS[slot]}`}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {TIME_SLOT_LABELS[slot]}반
                      </span>
                    </div>
                    <div className="space-y-2 pl-5">
                      {slotSchedules.map((s) => (
                        <div
                          key={s.id}
                          className={`rounded-lg border px-3 py-2 ${
                            s.is_closed
                              ? "border-red-200 bg-red-50/50"
                              : s.attendance_taken
                                ? "border-green-200 bg-green-50/30"
                                : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                {s.title || s.name}
                              </span>
                              {s.is_closed && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  휴강
                                </Badge>
                              )}
                              {s.has_makeup && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600">
                                  보충
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {s.attendance_taken ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              ) : !s.is_closed ? (
                                <XCircle className="h-3.5 w-3.5 text-slate-300" />
                              ) : null}
                              <Badge variant="secondary" className="text-xs">
                                {s.student_count ?? 0}{s.capacity ? `/${s.capacity}` : ""}명
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            {s.start_time && s.end_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {s.start_time} - {s.end_time}
                              </span>
                            )}
                            {s.instructor_name && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {s.instructor_name}
                              </span>
                            )}
                            {!s.is_closed && (
                              <Link
                                href={`/schedules/${s.id}/attendance`}
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                onClick={() => setDayDetailOpen(false)}
                              >
                                <ClipboardList className="h-3 w-3" />
                                출석부
                              </Link>
                            )}
                          </div>
                          {s.is_closed && s.close_reason && (
                            <p className="mt-1 text-[11px] text-red-500">
                              사유: {s.close_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayDetailOpen(false)}>
              닫기
            </Button>
            <Button onClick={openCreateFromDay}>
              <Plus className="h-4 w-4" />
              수업 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
