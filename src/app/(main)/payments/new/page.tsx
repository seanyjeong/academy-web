"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { paymentsAPI } from "@/lib/api/payments";
import { studentsAPI } from "@/lib/api/students";
import { toast } from "sonner";

const paymentSchema = z.object({
  student_id: z.number({ message: "학생을 선택하세요" }),
  month: z.string().min(1, "수납월을 입력하세요"),
  amount: z.number({ message: "금액을 입력하세요" }).min(1, "금액은 1원 이상이어야 합니다"),
  method: z.string().min(1, "수납방법을 선택하세요"),
  memo: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface Student {
  id: number;
  name: string;
}

export default function PaymentNewPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      month: new Date().toISOString().slice(0, 7),
      method: "",
      memo: "",
    },
  });

  const selectedStudentId = watch("student_id");

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await studentsAPI.list({ status: "active", search });
      setStudents(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setStudents([]);
    }
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onSubmit = async (formData: PaymentForm) => {
    setSubmitting(true);
    try {
      await paymentsAPI.create(formData as unknown as Record<string, unknown>);
      toast.success("수납이 등록되었습니다");
      router.push("/payments");
    } catch {
      toast.error("수납 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">수납 등록</h1>
        <p className="text-sm text-slate-500">새로운 수납을 등록합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>수납 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Student search */}
            <div className="space-y-2">
              <Label>학생 선택</Label>
              <Input
                placeholder="학생 이름 검색..."
                value={selectedStudent ? selectedStudent.name : search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (selectedStudentId) {
                    setValue("student_id", undefined as unknown as number);
                  }
                }}
              />
              {!selectedStudentId && search && students.length > 0 && (
                <div className="rounded-md border bg-white shadow-sm">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setValue("student_id", s.id, { shouldValidate: true });
                        setSearch("");
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.student_id && (
                <p className="text-sm text-red-500">
                  {errors.student_id.message}
                </p>
              )}
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label htmlFor="month">수납월</Label>
              <Input id="month" type="month" {...register("month")} />
              {errors.month && (
                <p className="text-sm text-red-500">{errors.month.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">금액 (원)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label>수납방법</Label>
              <Select
                value={watch("method")}
                onValueChange={(v) =>
                  setValue("method", v, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="수납방법 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
              {errors.method && (
                <p className="text-sm text-red-500">{errors.method.message}</p>
              )}
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Input id="memo" placeholder="메모 (선택)" {...register("memo")} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "등록 중..." : "등록"}
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
