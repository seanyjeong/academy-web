"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { settingsAPI } from "@/lib/api/admin";
import { formatKRW } from "@/lib/format";
import { toast } from "sonner";
import { Calculator } from "lucide-react";
import { STUDENT_TYPE_LABELS, type Student } from "@/lib/types/student";

const PAYMENT_TYPE_OPTIONS = [
  { value: "monthly", label: "월납" },
  { value: "season", label: "시즌" },
  { value: "material", label: "교재" },
  { value: "other", label: "기타" },
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PaymentNewPage() {
  const router = useRouter();

  // Student search
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Settings
  const [paymentDueDay, setPaymentDueDay] = useState(10);

  // Form fields
  const [paymentType, setPaymentType] = useState("monthly");
  const [yearMonth, setYearMonth] = useState(getCurrentMonth());
  const [baseAmount, setBaseAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [additionalAmount, setAdditionalAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calculated final amount
  const finalAmount = baseAmount - discountAmount + additionalAmount;

  // Prorated calculation (M10)
  const [showProrated, setShowProrated] = useState(false);
  const [proratedPreview, setProratedPreview] = useState<{
    total_days: number;
    remaining_days: number;
    daily_rate: number;
    prorated_amount: number;
  } | null>(null);
  const [proratedLoading, setProratedLoading] = useState(false);

  const enrollmentDate = selectedStudent?.enrollment_date;

  // Check if mid-month enrollment
  const isMidMonth = useMemo(() => {
    if (!enrollmentDate || !yearMonth) return false;
    const enrollDay = new Date(enrollmentDate).getDate();
    const enrollYM = enrollmentDate.slice(0, 7);
    return enrollYM === yearMonth && enrollDay > 1;
  }, [enrollmentDate, yearMonth]);

  const fetchProratedPreview = useCallback(async () => {
    if (!selectedStudent || !yearMonth) return;
    setProratedLoading(true);
    try {
      const { data } = await paymentsAPI.prepaidPreview({
        student_id: selectedStudent.id,
        year_month: yearMonth,
        base_amount: baseAmount,
      });
      setProratedPreview(data);
    } catch {
      // If API doesn't support this, calculate locally
      const enrollDay = enrollmentDate ? new Date(enrollmentDate).getDate() : 1;
      const [y, m] = yearMonth.split("-").map(Number);
      const totalDays = new Date(y, m, 0).getDate();
      const remainingDays = totalDays - enrollDay + 1;
      const dailyRate = Math.round(baseAmount / totalDays);
      const proratedAmount = Math.round((baseAmount * remainingDays) / totalDays);
      setProratedPreview({ total_days: totalDays, remaining_days: remainingDays, daily_rate: dailyRate, prorated_amount: proratedAmount });
    } finally {
      setProratedLoading(false);
    }
  }, [selectedStudent, yearMonth, baseAmount, enrollmentDate]);

  const applyProrated = () => {
    if (proratedPreview) {
      setBaseAmount(proratedPreview.prorated_amount);
      setDiscountAmount(0);
      setShowProrated(false);
      toast.success("일할 계산 금액이 적용되었습니다");
    }
  };

  // Fetch settings for payment_due_day
  useEffect(() => {
    settingsAPI.get().then(({ data }) => {
      if (data.payment_due_day) {
        setPaymentDueDay(data.payment_due_day);
      }
    }).catch(() => {});
  }, []);

  // Auto-compute due_date from yearMonth + paymentDueDay
  useEffect(() => {
    if (yearMonth) {
      const day = String(paymentDueDay).padStart(2, "0");
      setDueDate(`${yearMonth}-${day}`);
    }
  }, [yearMonth, paymentDueDay]);

  // Debounced student search
  const fetchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }
    try {
      const { data } = await studentsAPI.list({ status: "active", search: query });
      setStudents(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setStudents([]);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (selectedStudent) {
      setSelectedStudent(null);
    }
    setShowDropdown(true);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchStudents(value);
    }, 300);
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearch(student.name);
    setShowDropdown(false);
    setStudents([]);

    // Auto-fill base amount from student's monthly tuition for monthly type
    if (paymentType === "monthly") {
      setBaseAmount(student.final_monthly_tuition ?? 0);
    }

    // Auto-fill discount from student's discount
    if (student.discount_rate > 0 && paymentType === "monthly") {
      const disc = Math.round((student.monthly_tuition ?? 0) * (student.discount_rate / 100));
      setDiscountAmount(disc);
      setBaseAmount(student.monthly_tuition ?? 0);
    }

    // Use student-specific payment_due_day if set
    if (student.payment_due_day) {
      setPaymentDueDay(student.payment_due_day);
    }
  };

  // When payment type changes, reset amounts if student is selected
  useEffect(() => {
    if (selectedStudent && paymentType === "monthly") {
      if (selectedStudent.discount_rate > 0) {
        setBaseAmount(selectedStudent.monthly_tuition ?? 0);
        const disc = Math.round(
          (selectedStudent.monthly_tuition ?? 0) * (selectedStudent.discount_rate / 100)
        );
        setDiscountAmount(disc);
      } else {
        setBaseAmount(selectedStudent.final_monthly_tuition ?? 0);
        setDiscountAmount(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error("학생을 선택하세요");
      return;
    }
    if (finalAmount <= 0) {
      toast.error("최종금액은 0원 이상이어야 합니다");
      return;
    }

    setSubmitting(true);
    try {
      await paymentsAPI.create({
        student_id: selectedStudent.id,
        year_month: yearMonth,
        payment_type: paymentType,
        base_amount: baseAmount,
        discount_amount: discountAmount,
        additional_amount: additionalAmount,
        final_amount: finalAmount,
        due_date: dueDate || null,
        notes: notes || null,
      });
      toast.success("수납이 등록되었습니다");
      router.push("/payments");
    } catch {
      toast.error("수납 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student search */}
            <div className="space-y-2">
              <Label>학생 선택</Label>
              <div className="relative">
                <Input
                  placeholder="학생 이름 검색..."
                  value={selectedStudent ? selectedStudent.name : search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (!selectedStudent && search) setShowDropdown(true);
                  }}
                />
                {showDropdown && !selectedStudent && students.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {STUDENT_TYPE_LABELS[s.student_type] ?? s.student_type}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedStudent && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>월 수업료: {formatKRW(selectedStudent.final_monthly_tuition)}</span>
                  {selectedStudent.discount_rate > 0 && (
                    <span className="text-red-500">
                      (할인 {selectedStudent.discount_rate}%)
                    </span>
                  )}
                  <button
                    type="button"
                    className="ml-auto text-xs text-blue-500 hover:underline"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSearch("");
                      setBaseAmount(0);
                      setDiscountAmount(0);
                    }}
                  >
                    변경
                  </button>
                </div>
              )}
            </div>

            {/* Payment type */}
            <div className="space-y-2">
              <Label>수납 유형</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year/Month */}
            <div className="space-y-2">
              <Label htmlFor="year-month">수납월</Label>
              <Input
                id="year-month"
                type="month"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-amount">기본금액</Label>
                <Input
                  id="base-amount"
                  type="number"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-amount">할인금액</Label>
                <Input
                  id="discount-amount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additional-amount">추가금액</Label>
                <Input
                  id="additional-amount"
                  type="number"
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(Number(e.target.value))}
                  placeholder="보충 수업 등"
                />
              </div>
              <div className="space-y-2">
                <Label>최종금액</Label>
                <div className="flex h-9 items-center rounded-md border bg-slate-50 px-3 text-sm font-bold">
                  {formatKRW(finalAmount)}
                </div>
              </div>
            </div>

            {/* Prorated calculation preview (M10) */}
            {selectedStudent && (
              <div className="rounded-md border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">일할 계산</span>
                  </div>
                  {isMidMonth && (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-600">
                      중간 등록
                    </Badge>
                  )}
                </div>
                {isMidMonth && (
                  <p className="mt-1 text-xs text-blue-700">
                    등록일({enrollmentDate})이 월 중간이므로 일할 계산을 적용할 수 있습니다
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProrated(true);
                      fetchProratedPreview();
                    }}
                  >
                    일할 계산 미리보기
                  </Button>
                </div>
                {showProrated && (
                  <div className="mt-3 space-y-2 rounded-md bg-white p-3">
                    {proratedLoading ? (
                      <div className="flex justify-center py-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : proratedPreview ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-slate-500">해당월 총 일수</div>
                          <div className="text-right font-medium">{proratedPreview.total_days}일</div>
                          <div className="text-slate-500">수업 일수</div>
                          <div className="text-right font-medium">{proratedPreview.remaining_days}일</div>
                          <div className="text-slate-500">일일 요금</div>
                          <div className="text-right font-medium">{formatKRW(proratedPreview.daily_rate)}</div>
                          <div className="border-t pt-1 font-medium text-slate-900">일할 계산 금액</div>
                          <div className="border-t pt-1 text-right text-lg font-bold text-blue-600">
                            {formatKRW(proratedPreview.prorated_amount)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={applyProrated}
                        >
                          이 금액 적용
                        </Button>
                      </>
                    ) : (
                      <p className="text-center text-xs text-slate-400">계산할 수 없습니다</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Due date */}
            <div className="space-y-2">
              <Label htmlFor="due-date">납부 기한</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                기본값: 매월 {paymentDueDay}일 (설정에서 변경 가능)
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">메모</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="메모 (선택)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit */}
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
