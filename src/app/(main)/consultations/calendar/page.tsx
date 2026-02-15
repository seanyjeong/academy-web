"use client";

import { useEffect, useState, useCallback } from "react";
import { consultationsAPI } from "@/lib/api/consultations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ConsultationCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await consultationsAPI.calendar({
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth() + 1,
      });
      setEvents(Array.isArray(data) ? data : data.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      const d = e.consultation_date || e.date;
      return d && isSameDay(new Date(d), day);
    });

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">상담 캘린더</h1>
        <p className="text-sm text-slate-500">월별 상담 일정을 확인합니다</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>{format(currentMonth, "yyyy년 M월", { locale: ko })}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-px">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: startPadding }).map((_, i) => (
                    <div key={`pad-${i}`} className="min-h-[80px] bg-slate-50 p-1" />
                  ))}
                  {days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-[80px] border p-1 text-left transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:bg-slate-50"
                        } ${!isSameMonth(day, currentMonth) ? "text-slate-300" : ""}`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isToday ? "bg-blue-600 text-white" : ""
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDate ? format(selectedDate, "M월 d일 (E)", { locale: ko }) : "날짜를 선택하세요"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <p className="text-sm text-slate-400">캘린더에서 날짜를 클릭하세요</p>
              ) : selectedDayEvents.length === 0 ? (
                <p className="text-sm text-slate-400">해당 날짜에 상담이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((e, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{e.student_name || e.name}</span>
                        <Badge variant="secondary">{e.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{e.phone}</p>
                      {e.memo && <p className="mt-1 text-xs text-slate-400">{e.memo}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
