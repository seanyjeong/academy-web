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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ConsultationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    slug: "",
    enabled: true,
    fields: {
      school: true,
      grade: true,
      sport_interest: true,
      preferred_date: true,
    },
    notify_on_new: true,
    notify_email: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await consultationsAPI.settings();
        if (data) {
          setSettings((prev) => ({
            ...prev,
            slug: data.slug ?? "",
            enabled: data.is_active ?? true,
            fields: data.fields ?? prev.fields,
            notify_on_new: data.notify_on_new ?? true,
            notify_email: data.notify_email ?? "",
          }));
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

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "설정 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
