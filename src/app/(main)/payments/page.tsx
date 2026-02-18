"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paymentsAPI } from "@/lib/api/payments";
import { studentsAPI } from "@/lib/api/students";
import { formatKRW, formatDate } from "@/lib/format";
import { toast } from "sonner";

type PaymentStatus = "paid" | "unpaid" | "partial";

interface Payment {
  id: number;
  student_id: number;
  student_name?: string;
  year_month: string;
  payment_type: string;
  base_amount: number;
  discount_amount: number;
  additional_amount: number;
  final_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  paid_date: string | null;
  due_date: string | null;
  notes: string | null;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: "완납", className: "bg-green-50 text-green-600" },
  unpaid: { label: "미납", className: "bg-red-50 text-red-600" },
  partial: { label: "부분납", className: "bg-amber-50 text-amber-600" },
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  monthly: "월납",
  season: "시즌",
  material: "교재",
  other: "기타",
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  monthly: "bg-blue-50 text-blue-600",
  season: "bg-purple-50 text-purple-600",
  material: "bg-green-50 text-green-600",
  other: "bg-slate-100 text-slate-500",
};

const METHOD_OPTIONS = [
  { value: "cash", label: "현금" },
  { value: "card", label: "카드" },
  { value: "transfer", label: "계좌이체" },
  { value: "other", label: "기타" },
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentNames, setStudentNames] = useState<Record<number, string>>({});

  // Pay dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Payment | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("cash");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Bulk dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(getNextMonth());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Fetch student names once on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await studentsAPI.list({ limit: 1000 });
        const list = Array.isArray(data) ? data : data.items ?? [];
        const map: Record<number, string> = {};
        for (const s of list) {
          if (s.id && s.name) map[s.id] = s.name;
        }
        setStudentNames(map);
      } catch {
        // ignore
      }
    })();
  }, []);

  const getStudentName = useCallback(
    (studentId: number, apiName?: string) =>
      apiName || studentNames[studentId] || `학생 #${studentId}`,
    [studentNames]
  );

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (month) params.year_month = month;
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

  // Stats
  const totalAmount = payments.reduce((sum, p) => sum + p.final_amount, 0);
  const paidCount = payments.filter((p) => p.payment_status === "paid").length;
  const unpaidCount = payments.filter((p) => p.payment_status === "unpaid").length;
  const partialCount = payments.filter((p) => p.payment_status === "partial").length;

  // Pay dialog handlers
  const openPayDialog = (payment: Payment) => {
    setPayTarget(payment);
    setPayAmount(payment.final_amount - payment.paid_amount);
    setPayMethod("cash");
    setPayDialogOpen(true);
  };

  const handlePay = async () => {
    if (!payTarget) return;
    setPaySubmitting(true);
    try {
      await paymentsAPI.pay(payTarget.id, {
        amount: payAmount,
        method: payMethod,
      });
      toast.success("수납 처리가 완료되었습니다");
      setPayDialogOpen(false);
      setPayTarget(null);
      fetchPayments();
    } catch {
      toast.error("수납 처리에 실패했습니다");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Bulk dialog handler
  const handleBulkCreate = async () => {
    setBulkSubmitting(true);
    try {
      await paymentsAPI.bulkMonthly({ year_month: bulkMonth });
      toast.success(`${bulkMonth} 수납 내역이 생성되었습니다`);
      setBulkDialogOpen(false);
      fetchPayments();
    } catch {
      toast.error("일괄 생성에 실패했습니다");
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수납관리</h1>
          <p className="text-sm text-slate-500">학생 수납 현황을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <ListPlus className="mr-1 h-4 w-4" />
            일괄 생성
          </Button>
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="mr-1 h-4 w-4" />
              수납 등록
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">총 수납</p>
            <p className="text-xl font-bold text-slate-900">{formatKRW(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">완납</p>
            <p className="text-xl font-bold text-green-600">{paidCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">미납</p>
            <p className={`text-xl font-bold ${unpaidCount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {unpaidCount}건
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">부분납</p>
            <p className="text-xl font-bold text-amber-600">{partialCount}건</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[180px]"
            />
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="paid">완납</TabsTrigger>
                <TabsTrigger value="unpaid">미납</TabsTrigger>
                <TabsTrigger value="partial">부분납</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              수납 내역이 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생명</TableHead>
                    <TableHead>수납월</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead className="text-right">기본금액</TableHead>
                    <TableHead className="text-right">할인</TableHead>
                    <TableHead className="text-right">최종금액</TableHead>
                    <TableHead className="text-right">납부액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>납부일</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const statusCfg = STATUS_CONFIG[p.payment_status] ?? STATUS_CONFIG.unpaid;
                    const typeCfg = PAYMENT_TYPE_COLORS[p.payment_type] ?? PAYMENT_TYPE_COLORS.other;
                    const typeLabel = PAYMENT_TYPE_LABELS[p.payment_type] ?? p.payment_type;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/students/${p.student_id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {getStudentName(p.student_id, p.student_name)}
                          </Link>
                        </TableCell>
                        <TableCell>{p.year_month}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeCfg}>
                            {typeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatKRW(p.base_amount)}</TableCell>
                        <TableCell className="text-right">
                          {p.discount_amount > 0 ? (
                            <span className="text-red-500">-{formatKRW(p.discount_amount)}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatKRW(p.final_amount)}
                        </TableCell>
                        <TableCell className="text-right">{formatKRW(p.paid_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusCfg.className}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.paid_date ? formatDate(p.paid_date) : "-"}
                        </TableCell>
                        <TableCell>
                          {p.payment_status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPayDialog(p)}
                            >
                              수납처리
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수납 처리</DialogTitle>
          </DialogHeader>
          {payTarget && (
            <div className="space-y-4">
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <p>
                  <span className="text-slate-500">학생:</span>{" "}
                  <span className="font-medium">
                    {getStudentName(payTarget.student_id, payTarget.student_name)}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">최종금액:</span>{" "}
                  <span className="font-medium">{formatKRW(payTarget.final_amount)}</span>
                </p>
                <p>
                  <span className="text-slate-500">기납부액:</span>{" "}
                  <span className="font-medium">{formatKRW(payTarget.paid_amount)}</span>
                </p>
                <p>
                  <span className="text-slate-500">미납잔액:</span>{" "}
                  <span className="font-bold text-red-600">
                    {formatKRW(payTarget.final_amount - payTarget.paid_amount)}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-amount">납부금액</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>납부방법</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handlePay} disabled={paySubmitting || payAmount <= 0}>
              {paySubmitting ? "처리 중..." : "수납 완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk create dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수납 일괄 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-month">생성 월</Label>
              <Input
                id="bulk-month"
                type="month"
                value={bulkMonth}
                onChange={(e) => setBulkMonth(e.target.value)}
              />
            </div>
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              모든 재원생에 대해 <strong>{bulkMonth}</strong> 수납 내역을 생성합니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleBulkCreate} disabled={bulkSubmitting || !bulkMonth}>
              {bulkSubmitting ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
