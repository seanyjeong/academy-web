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
import { seasonsAPI } from "@/lib/api/seasons";

const seasonSchema = z.object({
  name: z.string().min(1, "시즌명을 입력하세요"),
  start_date: z.string().min(1, "시작일을 선택하세요"),
  end_date: z.string().min(1, "종료일을 선택하세요"),
  description: z.string().optional(),
});

type SeasonForm = z.infer<typeof seasonSchema>;

export default function SeasonNewPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeasonForm>({
    resolver: zodResolver(seasonSchema),
  });

  async function onSubmit(data: SeasonForm) {
    try {
      await seasonsAPI.create(data as unknown as Record<string, unknown>);
      toast.success("시즌이 등록되었습니다");
      router.push("/seasons");
    } catch {
      toast.error("시즌 등록에 실패했습니다");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">시즌 등록</h1>
        <p className="text-sm text-slate-500">새로운 시즌을 등록합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시즌 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">시즌명 *</Label>
              <Input
                id="name"
                placeholder="예: 2026 봄학기"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">시작일 *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-500">
                    {errors.start_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">종료일 *</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                />
                {errors.end_date && (
                  <p className="text-xs text-red-500">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                placeholder="시즌에 대한 설명 (선택)"
                {...register("description")}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "등록 중..." : "시즌 등록"}
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
