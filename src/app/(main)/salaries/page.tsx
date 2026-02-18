"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Calculator, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { salariesAPI } from "@/lib/api/payments";
import { instructorsAPI } from "@/lib/api/instructors";
import { formatKRW } from "@/lib/format";
import { toast } from "sonner";

interface Salary {
  id: number;
  instructor_id: number;
  instructor_name?: string;
  year_month: string;
  base_salary: number;
  overtime_pay: number;
  incentive: number;
  deductions: number;
  total_salary: number;
  paid_amount?: number;
  payment_status: string;
  paid_date?: string;
}

interface InstructorOption {
  id: number;
  name: string;
  salary_type?: string;
}

interface WorkSummary {
  instructor_name: string;
  total_classes: number;
  morning_classes: number;
  afternoon_classes: number;
  evening_classes: number;
  work_days: number;
  overtime_hours: number;
}

const SALARY_TYPE_LABELS: Record<string, string> = {
  hourly: "시급",
  per_class: "건당",
  monthly: "월급",
  mixed: "혼합",
};

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-50 text-red-600",
  partial: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
};

const STATUS_LABELS: Record<string, string> = {
  unpaid: "미지급",
  partial: "부분지급",
  paid: "지급완료",
};

function getMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = i === 0 ? "이번달" : i === 1 ? "지난달" : `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    options.push({ value, label });
  }
  return options;
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getMonthOptions()[0].value);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  // Calculate dialog
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInstructorId, setCalcInstructorId] = useState("");
  const [calcMonth, setCalcMonth] = useState(getMonthOptions()[0].value);
  const [workSummary, setWorkSummary] = useState<WorkSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await salariesAPI.list({ year_month: month });
      setSalaries(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await instructorsAPI.list();
        setInstructors(Array.isArray(data) ? data : data.items ?? []);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Load work summary when instructor is selected
  async function loadWorkSummary(instructorId: string, ym: string) {
    if (!instructorId) return;
    setLoadingSummary(true);
    setWorkSummary(null);
    try {
      const { data } = await salariesAPI.workSummary(Number(instructorId), ym);
      setWorkSummary(data);
    } catch {
      setWorkSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }

  function openCalcDialog() {
    setCalcInstructorId("");
    setCalcMonth(month);
    setWorkSummary(null);
    setCalcOpen(true);
  }

  async function handleCalculate() {
    if (!calcInstructorId) return;
    setCalculating(true);
    try {
      await salariesAPI.calculate({
        instructor_id: Number(calcInstructorId),
        year_month: calcMonth,
      });
      toast.success("급여가 생성되었습니다");
      setCalcOpen(false);
      setMonth(calcMonth);
      fetchSalaries();
    } catch {
      toast.error("급여 생성에 실패했습니다");
    } finally {
      setCalculating(false);
    }
  }

  async function handlePay(salaryId: number) {
    try {
      await salariesAPI.pay(salaryId);
      toast.success("지급 처리되었습니다");
      fetchSalaries();
    } catch {
      toast.error("지급 처리에 실패했습니다");
    }
  }

  const monthOptions = getMonthOptions();
  const totalSalary = salaries.reduce((sum, s) => sum + s.total_salary, 0);
  const paidCount = salaries.filter((s) => s.payment_status === "paid").length;
  const unpaidCount = salaries.filter((s) => s.payment_status !== "paid").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">급여관리</h1>
          <p className="text-sm text-slate-500">강사별 급여를 관리합니다</p>
        </div>
        <Button onClick={openCalcDialog}>
          <Calculator className="h-4 w-4" />
          급여 계산
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">총 급여</p>
            <p className="text-xl font-bold text-slate-900">{formatKRW(totalSalary)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">지급완료</p>
            <p className="text-xl font-bold text-green-600">{paidCount}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">미지급</p>
            <p className={`text-xl font-bold ${unpaidCount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {unpaidCount}명
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>급여 목록</CardTitle>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]">
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : salaries.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              급여 내역이 없습니다. &quot;급여 계산&quot; 버튼으로 생성하세요.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>강사명</TableHead>
                  <TableHead className="text-right">기본급</TableHead>
                  <TableHead className="text-right">초과근무</TableHead>
                  <TableHead className="text-right">수당</TableHead>
                  <TableHead className="text-right">공제</TableHead>
                  <TableHead className="text-right">실지급</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((s) => {
                  const instName =
                    s.instructor_name ||
                    instructors.find((i) => i.id === s.instructor_id)?.name ||
                    `강사 #${s.instructor_id}`;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-900">{instName}</TableCell>
                      <TableCell className="text-right">{formatKRW(s.base_salary)}</TableCell>
                      <TableCell className="text-right">{formatKRW(s.overtime_pay)}</TableCell>
                      <TableCell className="text-right">{formatKRW(s.incentive)}</TableCell>
                      <TableCell className="text-right text-red-500">
                        {s.deductions > 0 ? `-${formatKRW(s.deductions)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatKRW(s.total_salary)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[s.payment_status] ?? ""}
                        >
                          {STATUS_LABELS[s.payment_status] ?? s.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.payment_status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => handlePay(s.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            지급
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Calculate dialog */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>급여 계산</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">강사 선택</label>
                <Select
                  value={calcInstructorId}
                  onValueChange={(v) => {
                    setCalcInstructorId(v);
                    loadWorkSummary(v, calcMonth);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="강사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((inst) => (
                      <SelectItem key={inst.id} value={String(inst.id)}>
                        {inst.name}{" "}
                        <span className="text-slate-400">
                          ({SALARY_TYPE_LABELS[inst.salary_type ?? "per_class"]})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">대상 월</label>
                <Select
                  value={calcMonth}
                  onValueChange={(v) => {
                    setCalcMonth(v);
                    if (calcInstructorId) loadWorkSummary(calcInstructorId, v);
                  }}
                >
                  <SelectTrigger className="w-full">
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
              </div>
            </div>

            {/* Work summary */}
            {loadingSummary && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
            {workSummary && (
              <div className="rounded-md bg-slate-50 p-3 text-sm space-y-1">
                <p className="font-medium text-slate-700">{workSummary.instructor_name} 근무 요약</p>
                <div className="grid grid-cols-2 gap-x-4 text-slate-600">
                  <p>총 수업: <span className="font-medium text-slate-800">{workSummary.total_classes}건</span></p>
                  <p>근무일: <span className="font-medium text-slate-800">{workSummary.work_days}일</span></p>
                  <p>오전: {workSummary.morning_classes}건</p>
                  <p>오후: {workSummary.afternoon_classes}건</p>
                  <p>저녁: {workSummary.evening_classes}건</p>
                  {workSummary.overtime_hours > 0 && (
                    <p>초과근무: {workSummary.overtime_hours}시간</p>
                  )}
                </div>
                {workSummary.total_classes === 0 && (
                  <p className="text-amber-600">
                    스케줄 기록이 없습니다. 수업일정에서 강사를 배정하세요.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCalculate} disabled={!calcInstructorId || calculating}>
              {calculating ? "계산 중..." : "급여 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
