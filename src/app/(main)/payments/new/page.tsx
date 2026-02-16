"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
