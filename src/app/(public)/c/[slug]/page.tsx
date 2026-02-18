"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";

interface PublicAcademyInfo {
  academy_name?: string;
  description?: string;
  duration_minutes?: number;
  fields?: Record<string, boolean>;
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
        const { data } = await consultationsAPI.publicForm(slug);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name || !form.date || !form.time) {
      toast.error("이름, 날짜, 시간은 필수입니다");
      return;
    }
    setSubmitting(true);
    try {
      await consultationsAPI.publicSubmit(slug, form);
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">희망 상담일 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">희망 시간 *</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "신청 중..." : "상담 신청하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
