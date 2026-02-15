"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";

const paymentSchema = z.object({
  month: z.string().min(1, "수납월을 입력하세요"),
  amount: z.number({ message: "금액을 입력하세요" }).min(1, "금액은 1원 이상이어야 합니다"),
  paid_amount: z.number().min(0).optional(),
  method: z.string().min(1, "수납방법을 선택하세요"),
  memo: z.string().optional(),
});

type PaymentEditForm = z.infer<typeof paymentSchema>;

interface PaymentDetail {
  id: number;
  student_name: string;
  month: string;
  amount: number;
  paid_amount: number;
  method: string | null;
  memo: string | null;
}

export default function PaymentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentEditForm>({
    resolver: zodResolver(paymentSchema),
  });

  const fetchPayment = useCallback(async () => {
    try {
      const { data } = await paymentsAPI.get(Number(id));
      setPayment(data);
      reset({
        month: data.month,
        amount: data.amount,
        paid_amount: data.paid_amount,
        method: data.method ?? "",
        memo: data.memo ?? "",
      });
    } catch {
      toast.error("수납 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const onSubmit = async (formData: PaymentEditForm) => {
    setSubmitting(true);
    try {
      await paymentsAPI.update(
        Number(id),
        formData as unknown as Record<string, unknown>
      );
      toast.success("수납이 수정되었습니다");
      router.push(`/payments/${id}`);
    } catch {
      toast.error("수납 수정에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!payment) {
    return (
      <p className="py-20 text-center text-sm text-slate-400">
        수납 정보를 찾을 수 없습니다
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">수납 수정</h1>
        <p className="text-sm text-slate-500">
          {payment.student_name}님의 수납 정보를 수정합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>수납 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Student name (read-only) */}
            <div className="space-y-2">
              <Label>학생</Label>
              <Input value={payment.student_name} disabled />
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
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Paid amount */}
            <div className="space-y-2">
              <Label htmlFor="paid_amount">납부액 (원)</Label>
              <Input
                id="paid_amount"
                type="number"
                {...register("paid_amount", { valueAsNumber: true })}
              />
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
                {submitting ? "저장 중..." : "저장"}
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
