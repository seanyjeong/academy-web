"use client";

import { useState, useEffect } from "react";
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
import { schedulesAPI } from "@/lib/api/schedules";
import { instructorsAPI } from "@/lib/api/instructors";

const DAYS = [
  { value: "mon", label: "월" },
  { value: "tue", label: "화" },
  { value: "wed", label: "수" },
  { value: "thu", label: "목" },
  { value: "fri", label: "금" },
  { value: "sat", label: "토" },
  { value: "sun", label: "일" },
];

const scheduleSchema = z.object({
  name: z.string().min(1, "수업명을 입력하세요"),
  instructor_id: z.number().optional(),
  time_slot: z.enum(["morning", "afternoon", "evening"]),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  capacity: z.number().optional(),
  memo: z.string().optional(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

interface Instructor {
  id: number;
  name: string;
}

export default function ScheduleNewPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      time_slot: "morning",
    },
  });

  const timeSlot = watch("time_slot");

  useEffect(() => {
    async function loadInstructors() {
      try {
        const { data } = await instructorsAPI.list();
        setInstructors(data.items ?? data ?? []);
      } catch {
        setInstructors([]);
      }
    }
    loadInstructors();
  }, []);

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function onSubmit(data: ScheduleForm) {
    try {
      await schedulesAPI.create({
        ...data,
        days: selectedDays,
      } as unknown as Record<string, unknown>);
      toast.success("수업이 등록되었습니다");
      router.push("/schedules");
    } catch {
      toast.error("수업 등록에 실패했습니다");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">수업 등록</h1>
        <p className="text-sm text-slate-500">새로운 수업을 등록합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>수업 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">수업명 *</Label>
              <Input
                id="name"
                placeholder="예: 초등 오전반"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>강사 선택</Label>
              <Select
                onValueChange={(v) =>
                  setValue("instructor_id", Number(v), { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="강사를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={String(inst.id)}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>시간대</Label>
              <Select
                value={timeSlot}
                onValueChange={(v) =>
                  setValue("time_slot", v as "morning" | "afternoon" | "evening")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">오전</SelectItem>
                  <SelectItem value="afternoon">오후</SelectItem>
                  <SelectItem value="evening">저녁</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>요일 선택</Label>
              <div className="flex gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                      selectedDays.includes(d.value)
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">시작 시간</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register("start_time")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">종료 시간</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register("end_time")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">정원</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="정원 (선택)"
                {...register("capacity", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Input
                id="memo"
                placeholder="메모 (선택)"
                {...register("memo")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "등록 중..." : "수업 등록"}
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
