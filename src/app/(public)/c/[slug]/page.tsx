"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8350/api/v1";

interface BlockedSlot {
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

interface PublicAcademyInfo {
  academy_name?: string;
  description?: string;
  duration_minutes?: number;
  fields?: Record<string, boolean>;
  weekly_hours?: Record<string, string[]>;
  blocked_slots?: BlockedSlot[];
}

// Map JS getDay() (0=Sun) to weekday keys
const DAY_INDEX_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function generateTimeSlots(ranges: string[], durationMinutes: number): string[] {
  const slots: string[] = [];
  for (const range of ranges) {
    const [start, end] = range.split("-");
    if (!start || !end) continue;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let cur = sh * 60 + sm;
    const endMin = eh * 60 + em;
    while (cur + durationMinutes <= endMin) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      cur += durationMinutes;
    }
  }
  return slots;
}

export default function PublicConsultationFormPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [academy, setAcademy] = useState<PublicAcademyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    student_phone: "",
    parent_name: "",
    parent_phone: "",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/consultations/public/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data: PublicAcademyInfo = await res.json();
        setAcademy(data);
      } catch {
        setAcademy(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Blocked dates set for quick lookup
  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    if (!academy?.blocked_slots) return set;
    for (const slot of academy.blocked_slots) {
      set.add(slot.date);
    }
    return set;
  }, [academy?.blocked_slots]);

  // Available weekday keys (days that have at least one time range)
  const availableDayKeys = useMemo(() => {
    if (!academy?.weekly_hours) return new Set<string>();
    const set = new Set<string>();
    for (const [day, ranges] of Object.entries(academy.weekly_hours)) {
      if (Array.isArray(ranges) && ranges.length > 0) set.add(day);
    }
    return set;
  }, [academy?.weekly_hours]);

  // Time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!form.date || !academy?.weekly_hours) return [];
    const d = new Date(form.date + "T00:00:00");
    const dayKey = DAY_INDEX_TO_KEY[d.getDay()];
    const ranges = academy.weekly_hours[dayKey];
    if (!ranges || ranges.length === 0) return [];
    return generateTimeSlots(ranges, academy.duration_minutes ?? 30);
  }, [form.date, academy?.weekly_hours, academy?.duration_minutes]);

  // Minimum selectable date = today
  const minDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Check if selected date is valid
  const isDateAvailable = useMemo(() => {
    if (!form.date) return true;
    if (blockedDates.has(form.date)) return false;
    if (availableDayKeys.size === 0) return true; // no weekly_hours configured = all days ok
    const d = new Date(form.date + "T00:00:00");
    const dayKey = DAY_INDEX_TO_KEY[d.getDay()];
    return availableDayKeys.has(dayKey);
  }, [form.date, blockedDates, availableDayKeys]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name || !form.date || !form.time) {
      toast.error("이름, 날짜, 시간은 필수입니다");
      return;
    }
    if (!isDateAvailable) {
      toast.error("해당 날짜는 상담이 불가능합니다");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/consultations/public/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submit failed");
      router.push(`/c/${slug}/success`);
    } catch {
      toast.error("신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">존재하지 않는 페이지입니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Available day labels for info display
  const dayLabels: Record<string, string> = {
    sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토",
  };
  const availableDayDisplay = [...availableDayKeys]
    .sort((a, b) => DAY_INDEX_TO_KEY.indexOf(a) - DAY_INDEX_TO_KEY.indexOf(b))
    .map((k) => dayLabels[k])
    .join(", ");

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            {academy.academy_name?.charAt(0) || "A"}
          </div>
          <CardTitle className="text-xl">{academy.academy_name || "학원"}</CardTitle>
          <CardDescription>
            {academy.description || "상담 신청서를 작성해주세요"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableDayKeys.size > 0 && (
            <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              상담 가능 요일: <strong>{availableDayDisplay}요일</strong>
              {academy.duration_minutes && (
                <span className="ml-2 text-blue-500">
                  (1회 {academy.duration_minutes}분)
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="student_name">학생 이름 *</Label>
              <Input
                id="student_name"
                value={form.student_name}
                onChange={(e) => update("student_name", e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="student_phone">학생 연락처</Label>
              <Input
                id="student_phone"
                value={form.student_phone}
                onChange={(e) => update("student_phone", e.target.value)}
                placeholder="010-0000-0000"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="parent_name">보호자 이름</Label>
              <Input
                id="parent_name"
                value={form.parent_name}
                onChange={(e) => update("parent_name", e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="parent_phone">보호자 연락처</Label>
              <Input
                id="parent_phone"
                value={form.parent_phone}
                onChange={(e) => update("parent_phone", e.target.value)}
                placeholder="010-0000-0000"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="date">희망 상담일 *</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                value={form.date}
                onChange={(e) => {
                  update("date", e.target.value);
                  update("time", ""); // reset time on date change
                }}
                className="mt-1.5"
                required
              />
              {form.date && !isDateAvailable && (
                <p className="mt-1 text-xs text-red-500">
                  {blockedDates.has(form.date)
                    ? "해당 날짜는 차단되어 있습니다"
                    : "해당 요일은 상담이 불가능합니다"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="time">희망 시간 *</Label>
              {availableTimeSlots.length > 0 ? (
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {availableTimeSlots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("time", t)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        form.time === t
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              ) : form.date && isDateAvailable ? (
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                  className="mt-1.5"
                  required
                />
              ) : (
                <p className="mt-1.5 text-sm text-slate-400">
                  날짜를 먼저 선택해주세요
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">문의 내용</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={4}
                placeholder="궁금하신 점을 자유롭게 작성해주세요"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !isDateAvailable}
            >
              {submitting ? "신청 중..." : "상담 신청하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
