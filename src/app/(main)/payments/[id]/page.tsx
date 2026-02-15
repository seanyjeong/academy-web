"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentsAPI } from "@/lib/api/payments";
import { formatKRW, formatDate } from "@/lib/format";
import { toast } from "sonner";

type PaymentStatus = "paid" | "unpaid" | "partial";

interface PaymentDetail {
  id: number;
  student_id: number;
  student_name?: string;
  year_month: string;
  base_amount: number;
  final_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  notes: string | null;
  paid_date: string | null;
  created_at: string;
  history?: { id: number; amount: number; method: string; paid_at: string }[];
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  paid: { label: "완납", className: "bg-green-50 text-green-600" },
  unpaid: { label: "미납", className: "bg-red-50 text-red-600" },
  partial: { label: "부분납", className: "bg-amber-50 text-amber-600" },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "현금",
  card: "카드",
  transfer: "계좌이체",
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayment = useCallback(async () => {
    try {
      const { data } = await paymentsAPI.get(Number(id));
      setPayment(data);
    } catch {
      toast.error("수납 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await paymentsAPI.delete(Number(id));
      toast.success("삭제되었습니다");
      router.push("/payments");
    } catch {
      toast.error("삭제에 실패했습니다");
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

  const statusCfg = STATUS_CONFIG[payment.payment_status] ?? STATUS_CONFIG.unpaid;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수납 상세</h1>
          <p className="text-sm text-slate-500">수납 정보를 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/payments/${id}/edit`}>
              <Pencil />
              수정
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 />
            삭제
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Student info */}
        <Card>
          <CardHeader>
            <CardTitle>학생 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">학생명</dt>
                <dd className="font-medium">{payment.student_name ?? `학생 #${payment.student_id}`}</dd>
              </div>
              <div>
                <dt className="text-slate-500">수납월</dt>
                <dd className="font-medium">{payment.year_month}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card>
          <CardHeader>
            <CardTitle>수납 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">금액</dt>
                <dd className="font-medium">{formatKRW(payment.final_amount)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">납부액</dt>
                <dd className="font-medium">
                  {formatKRW(payment.paid_amount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">상태</dt>
                <dd>
                  <Badge variant="outline" className={statusCfg.className}>
                    {statusCfg.label}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">수납방법</dt>
                <dd className="font-medium">
                  {payment.payment_method ? (METHOD_LABELS[payment.payment_method] ?? payment.payment_method) : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">납부일</dt>
                <dd className="font-medium">
                  {payment.paid_date ? formatDate(payment.paid_date) : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">등록일</dt>
                <dd className="font-medium">{formatDate(payment.created_at)}</dd>
              </div>
              {payment.memo && (
                <div className="col-span-2">
                  <dt className="text-slate-500">메모</dt>
                  <dd className="font-medium">{payment.memo}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Payment history */}
        {payment.history && payment.history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>납부 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>납부일</TableHead>
                    <TableHead>수납방법</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{formatDate(h.paid_at)}</TableCell>
                      <TableCell>
                        {METHOD_LABELS[h.method] ?? h.method}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(h.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
