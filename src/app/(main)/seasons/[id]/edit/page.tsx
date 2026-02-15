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
import { seasonsAPI } from "@/lib/api/seasons";

const seasonSchema = z.object({
  name: z.string().min(1, "시즌명을 입력하세요"),
  start_date: z.string().min(1, "시작일을 선택하세요"),
  end_date: z.string().min(1, "종료일을 선택하세요"),
  description: z.string().optional(),
});

type SeasonEditForm = z.infer<typeof seasonSchema>;

export default function SeasonEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [seasonName, setSeasonName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SeasonEditForm>({
    resolver: zodResolver(seasonSchema),
  });

  const fetchSeason = useCallback(async () => {
    try {
      const { data } = await seasonsAPI.get(Number(id));
      setSeasonName(data.name);
      reset({
        name: data.name ?? "",
        start_date: data.start_date ?? "",
        end_date: data.end_date ?? "",
        description: data.description ?? "",
      });
    } catch {
      toast.error("시즌 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchSeason();
  }, [fetchSeason]);

  async function onSubmit(data: SeasonEditForm) {
    try {
      await seasonsAPI.update(
        Number(id),
        data as unknown as Record<string, unknown>
      );
      toast.success("시즌이 수정되었습니다");
      router.push(`/seasons/${id}`);
    } catch {
      toast.error("시즌 수정에 실패했습니다");
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
        <h1 className="text-xl font-bold text-slate-900">시즌 수정</h1>
        <p className="text-sm text-slate-500">
          {seasonName} 시즌 정보를 수정합니다
        </p>
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
