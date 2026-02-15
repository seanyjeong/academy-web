"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { consultationsAPI } from "@/lib/api/consultations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ConductConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    notes: "",
    result: "pending",
    follow_up_date: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await consultationsAPI.get(id);
        setConsultation(data);
        if (data.notes) setForm((f) => ({ ...f, notes: data.notes }));
      } catch {
        toast.error("상담 정보를 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await consultationsAPI.conduct(id, form);
      toast.success("상담이 저장되었습니다");
      router.push("/consultations");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="py-20 text-center text-slate-400">
        상담 정보를 찾을 수 없습니다
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-slate-900">상담 진행</h1>
        <p className="text-sm text-slate-500">상담 내용을 기록하고 결과를 저장합니다</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">이름</span>
              <p className="font-medium">{consultation.student_name || consultation.name}</p>
            </div>
            <div>
              <span className="text-slate-500">연락처</span>
              <p className="font-medium">{consultation.phone}</p>
            </div>
            <div>
              <span className="text-slate-500">학교</span>
              <p className="font-medium">{consultation.school || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500">학년</span>
              <p className="font-medium">{consultation.grade || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500">관심 종목</span>
              <p className="font-medium">{consultation.sport_interest || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500">상태</span>
              <Badge variant="secondary">{consultation.status}</Badge>
            </div>
          </div>
          {consultation.memo && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <span className="text-slate-500">문의 메모</span>
                <p className="mt-1">{consultation.memo}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상담 기록</CardTitle>
          <CardDescription>상담 진행 내용을 작성하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="notes">상담 내용</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={6}
                placeholder="상담 내용을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>상담 결과</Label>
                <Select value={form.result} onValueChange={(v) => update("result", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">보류</SelectItem>
                    <SelectItem value="enrolled">등록</SelectItem>
                    <SelectItem value="rejected">거절</SelectItem>
                    <SelectItem value="trial">체험 신청</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="follow_up_date">후속 상담일</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={form.follow_up_date}
                  onChange={(e) => update("follow_up_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/consultations">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
