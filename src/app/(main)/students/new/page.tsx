"use client";

import { useRouter } from "next/navigation";
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

const studentSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().optional(),
  parent_phone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  time_slot: z.enum(["morning", "afternoon", "evening"]).optional(),
  memo: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function NewStudentPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const timeSlot = watch("time_slot");

  async function onSubmit(data: StudentForm) {
    try {
      await studentsAPI.create({ ...data, status: "active" });
      toast.success("학생이 등록되었습니다");
      router.push("/students");
    } catch {
      toast.error("학생 등록에 실패했습니다");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">학생 등록</h1>
        <p className="text-sm text-slate-500">새로운 학생 정보를 입력하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                {isSubmitting ? "등록 중..." : "학생 등록"}
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
