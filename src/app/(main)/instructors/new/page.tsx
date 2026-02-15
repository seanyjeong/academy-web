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
import { instructorsAPI } from "@/lib/api/instructors";

const instructorSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().optional(),
  email: z.string().optional(),
  specialty: z.string().optional(),
  experience: z.string().optional(),
  memo: z.string().optional(),
});

type InstructorForm = z.infer<typeof instructorSchema>;

export default function InstructorNewPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstructorForm>({
    resolver: zodResolver(instructorSchema),
  });

  async function onSubmit(data: InstructorForm) {
    try {
      await instructorsAPI.create(data as unknown as Record<string, unknown>);
      toast.success("강사가 등록되었습니다");
      router.push("/instructors");
    } catch {
      toast.error("강사 등록에 실패했습니다");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">강사 등록</h1>
        <p className="text-sm text-slate-500">새로운 강사를 등록합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>강사 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="강사 이름"
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
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialty">전공</Label>
                <Input
                  id="specialty"
                  placeholder="예: 수영, 축구, 태권도"
                  {...register("specialty")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">경력</Label>
                <Input
                  id="experience"
                  placeholder="예: 5년"
                  {...register("experience")}
                />
              </div>
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
                {isSubmitting ? "등록 중..." : "강사 등록"}
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
