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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    name: "",
    phone: "",
    school: "",
    grade: "",
    sport_interest: "",
    memo: "",
    preferred_date: "",
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
    if (!form.name || !form.phone) {
      toast.error("이름과 연락처는 필수입니다");
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

  const fields = academy.fields || {};

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            {academy.academy_name?.charAt(0) || "A"}
          </div>
          <CardTitle className="text-xl">{academy.academy_name || "학원"}</CardTitle>
          <CardDescription>상담 신청서를 작성해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="010-0000-0000"
                className="mt-1.5"
                required
              />
            </div>

            {fields.school !== false && (
              <div>
                <Label htmlFor="school">학교</Label>
                <Input
                  id="school"
                  value={form.school}
                  onChange={(e) => update("school", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}

            {fields.grade !== false && (
              <div>
                <Label htmlFor="grade">학년</Label>
                <Select value={form.grade} onValueChange={(v) => update("grade", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {["중1", "중2", "중3", "고1", "고2", "고3"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {fields.sport_interest !== false && (
              <div>
                <Label htmlFor="sport_interest">관심 종목</Label>
                <Input
                  id="sport_interest"
                  value={form.sport_interest}
                  onChange={(e) => update("sport_interest", e.target.value)}
                  placeholder="예: 체육교육, 스포츠과학"
                  className="mt-1.5"
                />
              </div>
            )}

            <div>
              <Label htmlFor="memo">문의 내용</Label>
              <textarea
                id="memo"
                value={form.memo}
                onChange={(e) => update("memo", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={4}
                placeholder="궁금하신 점을 자유롭게 작성해주세요"
              />
            </div>

            {fields.preferred_date !== false && (
              <div>
                <Label htmlFor="preferred_date">희망 상담일</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => update("preferred_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "신청 중..." : "상담 신청하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
