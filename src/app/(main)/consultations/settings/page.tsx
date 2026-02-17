"use client";

import { useEffect, useState } from "react";
import { consultationsAPI } from "@/lib/api/consultations";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";

const WEEKDAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
];

interface BlockedSlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export default function ConsultationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    slug: "",
    enabled: true,
    duration_minutes: 30,
    max_per_slot: 1,
    fields: {
      school: true,
      grade: true,
      sport_interest: true,
      preferred_date: true,
    },
    notify_on_new: true,
    notify_email: "",
  });

  // Weekly hours
  const [weeklyHours, setWeeklyHours] = useState<Record<string, string[]>>({});
  const [savingHours, setSavingHours] = useState(false);

  // Blocked slots
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [newBlock, setNewBlock] = useState({ date: "", start_time: "09:00", end_time: "18:00", reason: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await consultationsAPI.settings();
        if (data) {
          setSettings((prev) => ({
            ...prev,
            slug: data.slug ?? "",
            enabled: data.is_active ?? true,
            duration_minutes: data.duration_minutes ?? 30,
            max_per_slot: data.max_per_slot ?? 1,
            fields: data.fields ?? prev.fields,
            notify_on_new: data.notify_on_new ?? true,
            notify_email: data.notify_email ?? "",
          }));
          if (data.weekly_hours && typeof data.weekly_hours === "object") {
            setWeeklyHours(data.weekly_hours);
          }
          if (Array.isArray(data.blocked_slots)) {
            setBlockedSlots(data.blocked_slots);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await consultationsAPI.updateSettings({
        slug: settings.slug,
        is_active: settings.enabled,
        duration_minutes: settings.duration_minutes,
        max_per_slot: settings.max_per_slot,
        fields: settings.fields,
        notify_on_new: settings.notify_on_new,
        notify_email: settings.notify_email,
      });
      toast.success("설정이 저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field: string) => {
    setSettings((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field as keyof typeof prev.fields],
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const fieldLabels: Record<string, string> = {
    school: "학교",
    grade: "학년",
    sport_interest: "관심 종목",
    preferred_date: "희망 상담일",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/consultations"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          상담관리로 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-slate-900">상담 설정</h1>
        <p className="text-sm text-slate-500">공개 상담 폼과 알림을 설정합니다</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>공개 상담 폼</CardTitle>
            <CardDescription>외부에서 접근 가능한 상담 신청 페이지를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>폼 활성화</Label>
              <button
                onClick={() => setSettings((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.enabled ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.enabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div>
              <Label htmlFor="slug">URL 슬러그</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm text-slate-400">/c/</span>
                <Input
                  id="slug"
                  value={settings.slug}
                  onChange={(e) => setSettings((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="my-academy"
                  className="flex-1"
                />
              </div>
              {settings.slug && (
                <p className="mt-1 text-xs text-slate-400">
                  공개 URL: {typeof window !== "undefined" ? window.location.origin : ""}/c/{settings.slug}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">표시 필드</Label>
              <div className="space-y-2">
                {Object.entries(fieldLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border px-4 py-2">
                    <span className="text-sm">{label}</span>
                    <button
                      onClick={() => toggleField(key)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        settings.fields[key as keyof typeof settings.fields]
                          ? "bg-blue-600"
                          : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.fields[key as keyof typeof settings.fields]
                            ? "left-[18px]"
                            : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>새 상담 문의가 접수되면 알림을 보냅니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>새 문의 알림</Label>
              <button
                onClick={() => setSettings((p) => ({ ...p, notify_on_new: !p.notify_on_new }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.notify_on_new ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.notify_on_new ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div>
              <Label htmlFor="notify_email">알림 이메일</Label>
              <Input
                id="notify_email"
                type="email"
                value={settings.notify_email}
                onChange={(e) => setSettings((p) => ({ ...p, notify_email: e.target.value }))}
                placeholder="admin@academy.com"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Duration & Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>상담 기본 설정</CardTitle>
            <CardDescription>상담 시간과 슬롯당 최대 인원을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>상담 시간 (분)</Label>
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={settings.duration_minutes}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, duration_minutes: Number(e.target.value) || 30 }))
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>슬롯당 최대 인원</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.max_per_slot}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, max_per_slot: Number(e.target.value) || 1 }))
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Hours */}
        <Card>
          <CardHeader>
            <CardTitle>주간 상담 가능 시간</CardTitle>
            <CardDescription>요일별 상담 가능 시간대를 설정합니다 (예: 09:00-12:00)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {WEEKDAYS.map(({ key, label }) => {
              const hours = weeklyHours[key] ?? [];
              return (
                <div key={key} className="flex items-center gap-3 rounded-lg border px-4 py-2">
                  <span className="w-8 text-sm font-medium">{label}</span>
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {hours.map((h, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {h}
                        <button
                          className="ml-1 text-slate-400 hover:text-red-500"
                          onClick={() => {
                            const updated = hours.filter((_, idx) => idx !== i);
                            setWeeklyHours((wh) => ({ ...wh, [key]: updated }));
                          }}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const range = prompt("시간대 입력 (예: 09:00-12:00)");
                        if (range && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(range)) {
                          setWeeklyHours((wh) => ({
                            ...wh,
                            [key]: [...(wh[key] ?? []), range],
                          }));
                        } else if (range) {
                          toast.error("형식: HH:MM-HH:MM");
                        }
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      추가
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={savingHours}
                onClick={async () => {
                  setSavingHours(true);
                  try {
                    await consultationsAPI.updateWeeklyHours({ weekly_hours: weeklyHours });
                    toast.success("주간 시간이 저장되었습니다");
                  } catch {
                    toast.error("저장에 실패했습니다");
                  } finally {
                    setSavingHours(false);
                  }
                }}
              >
                {savingHours ? "저장 중..." : "주간 시간 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Slots */}
        <Card>
          <CardHeader>
            <CardTitle>차단 슬롯</CardTitle>
            <CardDescription>특정 날짜/시간에 상담을 차단합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {blockedSlots.length > 0 && (
              <div className="space-y-2">
                {blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 px-4 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{slot.date}</p>
                      <p className="text-xs text-slate-500">
                        {slot.start_time} - {slot.end_time}
                        {slot.reason && ` (${slot.reason})`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={async () => {
                        try {
                          await consultationsAPI.removeBlockedSlot(slot.id);
                          setBlockedSlots((s) => s.filter((b) => b.id !== slot.id));
                          toast.success("차단 슬롯이 삭제되었습니다");
                        } catch {
                          toast.error("삭제에 실패했습니다");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock((b) => ({ ...b, date: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>사유</Label>
                <Input
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock((b) => ({ ...b, reason: e.target.value }))}
                  placeholder="예: 공휴일"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>시작</Label>
                <Input
                  type="time"
                  value={newBlock.start_time}
                  onChange={(e) => setNewBlock((b) => ({ ...b, start_time: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>종료</Label>
                <Input
                  type="time"
                  value={newBlock.end_time}
                  onChange={(e) => setNewBlock((b) => ({ ...b, end_time: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!newBlock.date}
              onClick={async () => {
                if (!newBlock.date) return;
                try {
                  const { data } = await consultationsAPI.addBlockedSlot({
                    date: newBlock.date,
                    start_time: newBlock.start_time,
                    end_time: newBlock.end_time,
                    reason: newBlock.reason || undefined,
                  });
                  setBlockedSlots((s) => [...s, data]);
                  setNewBlock({ date: "", start_time: "09:00", end_time: "18:00", reason: "" });
                  toast.success("차단 슬롯이 추가되었습니다");
                } catch {
                  toast.error("추가에 실패했습니다");
                }
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              차단 슬롯 추가
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "설정 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
