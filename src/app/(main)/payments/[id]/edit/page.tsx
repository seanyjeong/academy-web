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
  year_month: z.string().min(1, "수납월을 입력하세요"),
  final_amount: z.number({ message: "금액을 입력하세요" }).min(1, "금액은 1원 이상이어야 합니다"),
  paid_amount: z.number().min(0).optional(),
  payment_method: z.string().min(1, "수납방법을 선택하세요"),
  notes: z.string().optional(),
});

type PaymentEditForm = z.infer<typeof paymentSchema>;

interface PaymentDetail {
  id: number;
  student_name?: string;
  student_id: number;
  year_month: string;
  final_amount: number;
  paid_amount: number;
  payment_method: string | null;
  notes: string | null;
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
        year_month: data.year_month,
        final_amount: data.final_amount,
        paid_amount: data.paid_amount,
        payment_method: data.payment_method ?? "",
        notes: data.notes ?? "",
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
          {payment.student_name ?? `학생 #${payment.student_id}`}님의 수납 정보를 수정합니다
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
              <Input value={payment.student_name ?? `학생 #${payment.student_id}`} disabled />
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label htmlFor="year_month">수납월</Label>
              <Input id="year_month" type="month" {...register("year_month")} />
              {errors.year_month && (
                <p className="text-sm text-red-500">{errors.year_month.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="final_amount">금액 (원)</Label>
              <Input
                id="final_amount"
                type="number"
                {...register("final_amount", { valueAsNumber: true })}
              />
              {errors.final_amount && (
                <p className="text-sm text-red-500">{errors.final_amount.message}</p>
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
                value={watch("payment_method")}
                onValueChange={(v) =>
                  setValue("payment_method", v, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="수납방법 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="account">계좌이체</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-sm text-red-500">{errors.payment_method.message}</p>
              )}
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="notes">메모</Label>
              <Input id="notes" placeholder="메모 (선택)" {...register("notes")} />
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
