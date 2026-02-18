"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Calendar } from "lucide-react";
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
import { studentsAPI } from "@/lib/api/students";
import { paymentsAPI } from "@/lib/api/payments";
import type {
  StudentFormData,
  StudentType,
  Gender,
  Grade,
  AdmissionType,
  TimeSlot,
  TrialDate,
} from "@/lib/types/student";
import {
  STUDENT_TYPE_LABELS,
  GENDER_LABELS,
  ADMISSION_TYPE_LABELS,
  GRADE_OPTIONS,
  TIME_SLOT_LABELS,
  DAY_LABELS,
} from "@/lib/types/student";

// Tuition lookup table from academy settings
interface TuitionByWeeklyCount {
  weekly_1: number;
  weekly_2: number;
  weekly_3: number;
  weekly_4: number;
  weekly_5: number;
  weekly_6: number;
  weekly_7: number;
}

interface AcademySettings {
  exam_tuition?: TuitionByWeeklyCount;
  adult_tuition?: TuitionByWeeklyCount;
  payment_due_day?: number;
}

const DEFAULT_TUITION: TuitionByWeeklyCount = {
  weekly_1: 0,
  weekly_2: 0,
  weekly_3: 0,
  weekly_4: 0,
  weekly_5: 0,
  weekly_6: 0,
  weekly_7: 0,
};

// Grade options filtered by student type
const EXAM_GRADES: Grade[] = ["중3", "고1", "고2", "고3", "N수"];
const ADULT_GRADES: Grade[] = ["성인"];

export default function NewStudentPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<AcademySettings>({
    exam_tuition: { ...DEFAULT_TUITION },
    adult_tuition: { ...DEFAULT_TUITION },
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<StudentFormData>({
    name: "",
    gender: undefined,
    student_type: "exam",
    grade: undefined,
    admission_type: "regular",
    phone: "",
    parent_phone: "",
    school: "",
    address: "",
    class_days: [],
    weekly_count: 0,
    monthly_tuition: 0,
    discount_rate: 0,
    discount_reason: "",
    payment_due_day: undefined,
    time_slot: undefined,
    is_trial: false,
    trial_dates: [],
    memo: "",
    status: "active",
  });

  // Load academy settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await studentsAPI.settings();
      const data = res.data;
      const tuition = data.tuition_settings || {};
      setSettings({
        exam_tuition: tuition.exam || { ...DEFAULT_TUITION },
        adult_tuition: tuition.adult || { ...DEFAULT_TUITION },
        payment_due_day: data.payment_due_day,
      });
    } catch {
      // Settings not available, use defaults
    } finally {
      setSettingsLoaded(true);
    }
  };

  // Tuition lookup by student type and weekly count
  const getTuitionByWeeklyCount = useCallback(
    (studentType: StudentType, weeklyCount: number): number => {
      if (weeklyCount < 1 || weeklyCount > 7) return 0;
      const table =
        studentType === "exam"
          ? settings.exam_tuition
          : settings.adult_tuition;
      if (!table) return 0;
      const key = `weekly_${weeklyCount}` as keyof TuitionByWeeklyCount;
      return table[key] || 0;
    },
    [settings]
  );

  // Final tuition after discount (truncated to 1000 won)
  const finalTuition = useMemo(() => {
    const base = form.monthly_tuition || 0;
    const rate = form.discount_rate || 0;
    return Math.floor((base * (1 - rate / 100)) / 1000) * 1000;
  }, [form.monthly_tuition, form.discount_rate]);

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ko-KR").format(amount) + "원";

  // Grade options based on student type
  const gradeOptions = form.student_type === "exam" ? EXAM_GRADES : ADULT_GRADES;

  // Update form field
  const setField = <K extends keyof StudentFormData>(
    key: K,
    value: StudentFormData[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // When student_type changes, reset grade and admission_type, recalculate tuition
      if (key === "student_type") {
        next.grade = undefined;
        next.admission_type = "regular";
        if (settingsLoaded && next.weekly_count > 0) {
          next.monthly_tuition = getTuitionByWeeklyCount(
            value as StudentType,
            next.weekly_count
          );
        }
      }

      return next;
    });
  };

  // Toggle class day (Mon-Sat: 1-6)
  const handleClassDayToggle = (day: number) => {
    setForm((prev) => {
      const current = prev.class_days;
      const newDays = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b);
      const newWeeklyCount = newDays.length;
      const newTuition = settingsLoaded
        ? getTuitionByWeeklyCount(prev.student_type, newWeeklyCount)
        : prev.monthly_tuition;

      return {
        ...prev,
        class_days: newDays,
        weekly_count: newWeeklyCount,
        monthly_tuition: newTuition || prev.monthly_tuition,
      };
    });
  };

  // Trial dates management
  const addTrialDate = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({
      ...prev,
      trial_dates: [...(prev.trial_dates || []), { date: today, time_slot: "afternoon" as TimeSlot }],
    }));
  };

  const removeTrialDate = (index: number) => {
    setForm((prev) => ({
      ...prev,
      trial_dates: (prev.trial_dates || []).filter((_, i) => i !== index),
    }));
  };

  const updateTrialDate = (
    index: number,
    field: keyof TrialDate,
    value: string
  ) => {
    setForm((prev) => {
      const dates = [...(prev.trial_dates || [])];
      dates[index] = { ...dates[index], [field]: value };
      return { ...prev, trial_dates: dates };
    });
  };

  // Phone number auto-format
  const formatPhone = (value: string): string => {
    const nums = value.replace(/[^0-9]/g, "");
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("이름을 입력하세요");
      return;
    }

    const submitData = {
      ...form,
      status: form.is_trial ? ("trial" as const) : ("active" as const),
      trial_remaining: form.is_trial
        ? (form.trial_dates || []).filter((td) => !td.attended).length || 2
        : undefined,
      trial_dates: form.is_trial ? form.trial_dates : undefined,
      // Convert empty strings to undefined
      phone: form.phone || undefined,
      parent_phone: form.parent_phone || undefined,
      school: form.school || undefined,
      address: form.address || undefined,
      discount_reason: form.discount_reason || undefined,
      memo: form.memo || undefined,
      grade: form.grade || undefined,
    };

    try {
      setSubmitting(true);
      const res = await studentsAPI.create(submitData);
      const newStudent = res.data;

      // Auto-create payment for current month if not trial and has tuition
      if (!form.is_trial && finalTuition > 0 && newStudent?.id) {
        try {
          const now = new Date();
          const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const todayDay = now.getDate();

          // Prorated calculation if mid-month enrollment
          let paymentAmount = finalTuition;
          if (todayDay > 1) {
            try {
              const preview = await paymentsAPI.prepaidPreview({
                student_id: newStudent.id,
                base_amount: finalTuition,
                enrollment_date: now.toISOString().split("T")[0],
                year_month: yearMonth,
              });
              if (preview.data?.prorated_amount != null) {
                paymentAmount = preview.data.prorated_amount;
              }
            } catch {
              // Backend preview not available, calculate locally
              const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const remainingDays = totalDays - todayDay + 1;
              paymentAmount = Math.floor((finalTuition / totalDays) * remainingDays / 1000) * 1000;
            }
          }

          await paymentsAPI.create({
            student_id: newStudent.id,
            year_month: yearMonth,
            payment_type: "monthly",
            base_amount: form.monthly_tuition || 0,
            discount_amount: (form.monthly_tuition || 0) - finalTuition,
            final_amount: paymentAmount,
            payment_status: "unpaid",
            notes: todayDay > 1 ? `일할계산 (${todayDay}일 등록)` : undefined,
          });
          const msg = todayDay > 1
            ? `학생 등록 완료 (${yearMonth} 일할계산 수납 ${paymentAmount.toLocaleString()}원 생성)`
            : "학생이 등록되고 수납이 자동 생성되었습니다";
          toast.success(msg);
        } catch {
          toast.success("학생이 등록되었습니다 (수납 자동 생성 실패 - 수동으로 생성해주세요)");
        }
      } else {
        toast.success("학생이 등록되었습니다");
      }

      router.push("/students");
    } catch {
      toast.error("학생 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">학생 등록</h1>
        <p className="text-sm text-slate-500">새로운 학생 정보를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="학생 이름"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>성별</Label>
              <div className="flex gap-4">
                {(Object.entries(GENDER_LABELS) as [Gender, string][]).map(
                  ([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={form.gender === value}
                        onChange={() => setField("gender", value)}
                        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Student Type + Grade */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>학생 유형</Label>
                <Select
                  value={form.student_type}
                  onValueChange={(v) => setField("student_type", v as StudentType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(STUDENT_TYPE_LABELS) as [StudentType, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>학년</Label>
                <Select
                  value={form.grade ?? ""}
                  onValueChange={(v) => setField("grade", v as Grade)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Admission Type - only for exam */}
            {form.student_type === "exam" && (
              <div className="space-y-2">
                <Label>입시 유형</Label>
                <Select
                  value={form.admission_type}
                  onValueChange={(v) =>
                    setField("admission_type", v as AdmissionType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(ADMISSION_TYPE_LABELS) as [
                        AdmissionType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* School */}
            <div className="space-y-2">
              <Label htmlFor="school">학교</Label>
              <Input
                id="school"
                placeholder="학교 이름"
                value={form.school ?? ""}
                onChange={(e) => setField("school", e.target.value)}
              />
            </div>

            {/* Phone numbers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  placeholder="010-0000-0000"
                  value={form.phone ?? ""}
                  maxLength={13}
                  onChange={(e) =>
                    setField("phone", formatPhone(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">학부모 연락처</Label>
                <Input
                  id="parent_phone"
                  placeholder="010-0000-0000"
                  value={form.parent_phone ?? ""}
                  maxLength={13}
                  onChange={(e) =>
                    setField("parent_phone", formatPhone(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                placeholder="주소"
                value={form.address ?? ""}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Class Info */}
        <Card>
          <CardHeader>
            <CardTitle>수업 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Time Slot */}
            <div className="space-y-2">
              <Label>시간대</Label>
              <Select
                value={form.time_slot ?? ""}
                onValueChange={(v) => setField("time_slot", v as TimeSlot)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시간대 선택" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(TIME_SLOT_LABELS) as [TimeSlot, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Days - Mon(1) to Sat(6) toggle buttons */}
            <div className="space-y-2">
              <Label>
                수업일{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (선택하면 주 수업횟수가 자동 계산됩니다)
                </span>
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleClassDayToggle(day)}
                    className={`h-10 w-12 rounded-md border text-sm font-medium transition-colors ${
                      form.class_days.includes(day)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Count (read-only) */}
            <div className="space-y-2">
              <Label>주 수업횟수</Label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                주 {form.weekly_count}회
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Tuition Info */}
        <Card>
          <CardHeader>
            <CardTitle>수업료 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Monthly Tuition */}
            <div className="space-y-2">
              <Label htmlFor="monthly_tuition">
                월 수업료{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (수업횟수에 따라 자동 설정, 수정 가능)
                </span>
              </Label>
              <Input
                id="monthly_tuition"
                type="number"
                min={0}
                step={10000}
                value={form.monthly_tuition || ""}
                onChange={(e) =>
                  setField(
                    "monthly_tuition",
                    e.target.value === "" ? 0 : parseInt(e.target.value)
                  )
                }
                placeholder="0"
              />
            </div>

            {/* Discount Rate */}
            <div className="space-y-2">
              <Label htmlFor="discount_rate">할인율 (%)</Label>
              <Input
                id="discount_rate"
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.discount_rate || ""}
                onChange={(e) =>
                  setField(
                    "discount_rate",
                    e.target.value === "" ? 0 : parseFloat(e.target.value)
                  )
                }
                placeholder="0"
              />
            </div>

            {/* Discount Reason (shown when discount > 0) */}
            {(form.discount_rate || 0) > 0 && (
              <div className="space-y-2">
                <Label htmlFor="discount_reason">할인 사유</Label>
                <Input
                  id="discount_reason"
                  placeholder="예: 형제자매 할인, 장기등록 할인"
                  value={form.discount_reason ?? ""}
                  onChange={(e) =>
                    setField("discount_reason", e.target.value)
                  }
                />
              </div>
            )}

            {/* Final Tuition (auto-calculated) */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">월 수업료</span>
                <span>{formatCurrency(form.monthly_tuition || 0)}</span>
              </div>
              {(form.discount_rate || 0) > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>할인 ({form.discount_rate}%)</span>
                  <span>
                    -
                    {formatCurrency(
                      (form.monthly_tuition || 0) -
                        finalTuition
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-sm">최종 수업료</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(finalTuition)}
                </span>
              </div>
            </div>

            {/* Payment Due Day */}
            <div className="space-y-2">
              <Label>
                납부일{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (비워두면 학원 기본값{" "}
                  {settings.payment_due_day || 10}일 사용)
                </span>
              </Label>
              <Select
                value={form.payment_due_day?.toString() ?? ""}
                onValueChange={(v) =>
                  setField(
                    "payment_due_day",
                    v ? parseInt(v) : undefined
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="학원 기본값 사용" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      매월 {day}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Trial Registration */}
        <Card>
          <CardHeader>
            <CardTitle>체험 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_trial}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((prev) => {
                    const next = { ...prev, is_trial: checked };
                    if (checked && (!prev.trial_dates || prev.trial_dates.length === 0)) {
                      const today = new Date().toISOString().split("T")[0];
                      next.trial_dates = [
                        { date: today, time_slot: "afternoon" as TimeSlot },
                      ];
                    }
                    return next;
                  });
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">
                체험 수업 학생으로 등록
              </span>
            </label>

            {form.is_trial && (
              <div className="ml-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>체험 일정</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTrialDate}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    일정 추가
                  </Button>
                </div>

                {(form.trial_dates || []).length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">
                    체험 일정을 추가하세요.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(form.trial_dates || []).map((td, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3"
                      >
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">
                          {idx + 1}회차
                        </span>
                        <input
                          type="date"
                          value={td.date}
                          onChange={(e) =>
                            updateTrialDate(idx, "date", e.target.value)
                          }
                          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={td.time_slot}
                          onChange={(e) =>
                            updateTrialDate(
                              idx,
                              "time_slot",
                              e.target.value
                            )
                          }
                          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {(
                            Object.entries(TIME_SLOT_LABELS) as [
                              TimeSlot,
                              string,
                            ][]
                          ).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeTrialDate(idx)}
                          className="rounded p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  <p className="font-medium">체험생 안내</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-blue-600">
                    <li>체험 수업은 무료로 진행됩니다</li>
                    <li>출석 시 남은 체험 횟수가 자동 차감됩니다</li>
                    <li>체험 완료 후 정식 등록으로 전환할 수 있습니다</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Memo */}
        <Card>
          <CardHeader>
            <CardTitle>메모</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="memo"
              placeholder="특이사항, 상담 내용 등"
              value={form.memo ?? ""}
              onChange={(e) => setField("memo", e.target.value)}
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex gap-3 pb-8">
          <Button type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "학생 등록"}
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
    </div>
  );
}
