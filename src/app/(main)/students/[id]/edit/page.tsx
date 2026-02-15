"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentsAPI } from "@/lib/api/students";
import { StudentStatus, STATUS_LABELS } from "@/lib/types/student";

const studentSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().optional(),
  parent_phone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  time_slot: z.enum(["morning", "afternoon", "evening"]).optional(),
  status: z.enum(["active", "paused", "withdrawn", "graduated", "trial", "pending"]),
  memo: z.string().optional(),
});

type StudentEditForm = z.infer<typeof studentSchema>;

export default function StudentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentEditForm>({
    resolver: zodResolver(studentSchema),
  });

  const timeSlot = watch("time_slot");
  const status = watch("status");

  const fetchStudent = useCallback(async () => {
    try {
      const { data } = await studentsAPI.get(Number(id));
      setStudentName(data.name);
      reset({
        name: data.name ?? "",
        phone: data.phone ?? "",
        parent_phone: data.parent_phone ?? "",
        school: data.school ?? "",
        grade: data.grade ?? "",
        time_slot: data.time_slot ?? undefined,
        status: data.status ?? "active",
        memo: data.memo ?? "",
      });
    } catch {
      toast.error("학생 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  async function onSubmit(data: StudentEditForm) {
    try {
      await studentsAPI.update(Number(id), {
        ...data,
        time_slot: data.time_slot || undefined,
      });
      toast.success("학생 정보가 수정되었습니다");
      router.push(`/students/${id}`);
    } catch {
      toast.error("학생 수정에 실패했습니다");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">학생 수정</h1>
        <p className="text-sm text-slate-500">
          {studentName}님의 정보를 수정합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  placeholder="학생 이름"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setValue("status", v as StudentStatus, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as StudentStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  placeholder="010-0000-0000"
                  {...register("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">학부모 연락처</Label>
                <Input
                  id="parent_phone"
                  placeholder="010-0000-0000"
                  {...register("parent_phone")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="school">학교</Label>
                <Input
                  id="school"
                  placeholder="학교 이름"
                  {...register("school")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Input
                  id="grade"
                  placeholder="예: 초3, 중1"
                  {...register("grade")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>수업 시간대</Label>
              <Select
                value={timeSlot ?? ""}
                onValueChange={(v) =>
                  setValue("time_slot", v as "morning" | "afternoon" | "evening")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시간대 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">오전반</SelectItem>
                  <SelectItem value="afternoon">오후반</SelectItem>
                  <SelectItem value="evening">저녁반</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                placeholder="특이사항, 메모 등"
                {...register("memo")}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
