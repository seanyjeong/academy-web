"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewInquiryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    school: "",
    grade: "",
    sport_interest: "",
    memo: "",
    consultation_date: "",
    source: "phone",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("이름과 연락처는 필수입니다");
      return;
    }
    setLoading(true);
    try {
      await consultationsAPI.create(form);
      toast.success("문의가 등록되었습니다");
      router.push("/consultations");
    } catch {
      toast.error("등록에 실패했습니다");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-xl font-bold text-slate-900">새 문의 등록</h1>
        <p className="text-sm text-slate-500">신규 상담 문의를 등록합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>문의 정보</CardTitle>
          <CardDescription>상담 문의자의 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">학교</Label>
                <Input
                  id="school"
                  value={form.school}
                  onChange={(e) => update("school", e.target.value)}
                  className="mt-1.5"
                />
              </div>
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
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consultation_date">희망 상담일</Label>
                <Input
                  id="consultation_date"
                  type="date"
                  value={form.consultation_date}
                  onChange={(e) => update("consultation_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>유입 경로</Label>
                <Select value={form.source} onValueChange={(v) => update("source", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">전화</SelectItem>
                    <SelectItem value="visit">방문</SelectItem>
                    <SelectItem value="online">온라인</SelectItem>
                    <SelectItem value="referral">추천</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                value={form.memo}
                onChange={(e) => update("memo", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={4}
                placeholder="추가 메모 사항"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/consultations">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "등록 중..." : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
