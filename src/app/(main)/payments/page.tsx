"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type PaymentStatus = "paid" | "unpaid" | "partial";

interface Payment {
  id: number;
  student_name: string;
  month: string;
  amount: number;
  paid_amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  method: string | null;
  memo: string | null;
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  paid: { label: "완납", className: "bg-green-50 text-green-600" },
  unpaid: { label: "미납", className: "bg-red-50 text-red-600" },
  partial: { label: "부분납", className: "bg-amber-50 text-amber-600" },
};

function getMonthOptions() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  return [
    { value: thisMonth, label: "이번달" },
    { value: lastMonth, label: "지난달" },
    { value: "all", label: "전체" },
  ];
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getMonthOptions()[0].value);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (month !== "all") params.month = month;
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await paymentsAPI.list(params);
      setPayments(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [month, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const monthOptions = getMonthOptions();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수납관리</h1>
          <p className="text-sm text-slate-500">학생 수납 현황을 관리합니다</p>
        </div>
        <Button asChild>
          <Link href="/payments/new">
            <Plus />
            수납 등록
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="paid">완납</TabsTrigger>
                <TabsTrigger value="unpaid">미납</TabsTrigger>
                <TabsTrigger value="partial">부분납</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              수납 내역이 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생명</TableHead>
                  <TableHead>수납월</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead className="text-right">납부액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>납부일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.unpaid;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/payments/${p.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {p.student_name}
                        </Link>
                      </TableCell>
                      <TableCell>{p.month}</TableCell>
                      <TableCell className="text-right">
                        {formatKRW(p.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(p.paid_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.paid_at ? formatDate(p.paid_at) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
