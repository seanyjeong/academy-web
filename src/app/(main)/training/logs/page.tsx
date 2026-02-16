"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Save,
  NotebookPen,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  logsAPI,
  plansAPI,
  assignmentsAPI,
} from "@/lib/api/training";
import type {
  TrainingLog,
  DailyPlan,
  DailyAssignment,
} from "@/lib/types/training";
import { TIME_SLOT_MAP, CONDITION_OPTIONS } from "@/lib/types/training";

type TimeSlot = "morning" | "afternoon" | "evening";

interface StudentLogState {
  studentId: number;
  studentName: string;
  logId?: number;
  condition: string;
  content: string;
  dirty: boolean;
  saving: boolean;
}

function parsePlanExercises(json: string | null): { name: string }[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function LogsPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [studentLogs, setStudentLogs] = useState<StudentLogState[]>([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [showPlan, setShowPlan] = useState(false);

  // Load assignments + logs + plan for date + time_slot
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, logRes, planRes] = await Promise.all([
        assignmentsAPI.list({ date, time_slot: timeSlot }),
        logsAPI.list({ date, time_slot: timeSlot }),
        plansAPI.list({ date, time_slot: timeSlot }),
      ]);

      const assignments = assignRes.data as (DailyAssignment & {
        student_name?: string;
      })[];
      const logs = logRes.data as TrainingLog[];
      const plans = planRes.data as DailyPlan[];
      setPlan(plans.length > 0 ? plans[0] : null);

      // Merge: each assigned student gets a log card
      const states: StudentLogState[] = assignments.map((a) => {
        const log = logs.find((l) => l.student_id === a.student_id);
        return {
          studentId: a.student_id,
          studentName: a.student_name ?? `#${a.student_id}`,
          logId: log?.id,
          condition: log?.condition ?? "",
          content: log?.content ?? "",
          dirty: false,
          saving: false,
        };
      });

      setStudentLogs(states);
    } catch {
      toast.error("수업 일지를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [date, timeSlot]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update condition for a student
  const handleConditionChange = async (
    studentId: number,
    condition: string
  ) => {
    // Optimistic update
    setStudentLogs((prev) =>
      prev.map((s) =>
        s.studentId === studentId ? { ...s, condition, dirty: true } : s
      )
    );

    const state = studentLogs.find((s) => s.studentId === studentId);
    if (!state) return;

    try {
      if (state.logId) {
        // Update condition via dedicated endpoint
        await logsAPI.updateCondition(state.logId, { condition });
      } else {
        // Create log with condition
        const { data } = await logsAPI.create({
          student_id: studentId,
          date,
          time_slot: timeSlot,
          content: state.content || "",
          condition,
        });
        const newLog = data as TrainingLog;
        setStudentLogs((prev) =>
          prev.map((s) =>
            s.studentId === studentId
              ? { ...s, logId: newLog.id, dirty: false }
              : s
          )
        );
        return;
      }

      setStudentLogs((prev) =>
        prev.map((s) =>
          s.studentId === studentId ? { ...s, dirty: false } : s
        )
      );
    } catch {
      toast.error("컨디션 저장에 실패했습니다");
    }
  };

  // Update content text
  const handleContentChange = (studentId: number, content: string) => {
    setStudentLogs((prev) =>
      prev.map((s) =>
        s.studentId === studentId ? { ...s, content, dirty: true } : s
      )
    );
  };

  // Save individual student log
  const handleSaveLog = async (studentId: number) => {
    const state = studentLogs.find((s) => s.studentId === studentId);
    if (!state) return;

    setStudentLogs((prev) =>
      prev.map((s) =>
        s.studentId === studentId ? { ...s, saving: true } : s
      )
    );

    try {
      if (state.logId) {
        await logsAPI.update(state.logId, {
          content: state.content,
          condition: state.condition,
        });
      } else {
        const { data } = await logsAPI.create({
          student_id: studentId,
          date,
          time_slot: timeSlot,
          content: state.content,
          condition: state.condition,
        });
        const newLog = data as TrainingLog;
        setStudentLogs((prev) =>
          prev.map((s) =>
            s.studentId === studentId
              ? { ...s, logId: newLog.id, dirty: false, saving: false }
              : s
          )
        );
        toast.success(`${state.studentName} 일지 저장됨`);
        return;
      }

      setStudentLogs((prev) =>
        prev.map((s) =>
          s.studentId === studentId ? { ...s, dirty: false, saving: false } : s
        )
      );
      toast.success(`${state.studentName} 일지 저장됨`);
    } catch {
      setStudentLogs((prev) =>
        prev.map((s) =>
          s.studentId === studentId ? { ...s, saving: false } : s
        )
      );
      toast.error("저장에 실패했습니다");
    }
  };

  // Batch set condition for all students
  const handleBatchCondition = async (condition: string) => {
    const promises = studentLogs.map(async (state) => {
      if (state.logId) {
        return logsAPI.updateCondition(state.logId, { condition });
      } else {
        return logsAPI.create({
          student_id: state.studentId,
          date,
          time_slot: timeSlot,
          content: state.content || "",
          condition,
        });
      }
    });

    try {
      await Promise.all(promises);
      toast.success("전체 컨디션이 설정되었습니다");
      fetchData();
    } catch {
      toast.error("일괄 설정에 실패했습니다");
    }
  };

  // Condition stats
  const conditionCounts: Record<string, number> = {};
  for (const s of studentLogs) {
    if (s.condition) {
      conditionCounts[s.condition] = (conditionCounts[s.condition] || 0) + 1;
    }
  }

  const prevDate = () =>
    setDate((prev) => format(subDays(parseISO(prev), 1), "yyyy-MM-dd"));
  const nextDate = () =>
    setDate((prev) => format(addDays(parseISO(prev), 1), "yyyy-MM-dd"));
  const goToday = () => setDate(format(new Date(), "yyyy-MM-dd"));

  const planExercises = plan ? parsePlanExercises(plan.exercises) : [];

  const CONDITION_BG: Record<string, string> = {
    excellent: "bg-green-500",
    good: "bg-blue-500",
    normal: "bg-gray-400",
    poor: "bg-orange-500",
    bad: "bg-red-500",
  };

  const CONDITION_RING: Record<string, string> = {
    excellent: "ring-green-500",
    good: "ring-blue-500",
    normal: "ring-gray-400",
    poor: "ring-orange-500",
    bad: "ring-red-500",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수업 일지</h1>
          <p className="text-sm text-slate-500">
            학생별 수업 내용과 컨디션을 기록합니다
          </p>
        </div>
      </div>

      {/* Plan reference (collapsible) */}
      {plan && (
        <Card className="mb-4">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowPlan(!showPlan)}
          >
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-blue-500" />
              오늘의 수업 계획
              <Badge variant="secondary" className="text-xs">
                {planExercises.length}개 운동
              </Badge>
            </CardTitle>
            <CardAction>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  showPlan ? "rotate-180" : ""
                }`}
              />
            </CardAction>
          </CardHeader>
          {showPlan && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {planExercises.map((ex, i) => (
                  <Badge key={i} variant="outline">
                    {i + 1}. {ex.name}
                  </Badge>
                ))}
              </div>
              {plan.conditions && (
                <p className="mt-2 text-xs text-slate-500">
                  {plan.conditions}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {/* Date Nav */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevDate}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center font-medium">
                {date}
              </span>
              <Button variant="outline" size="icon" onClick={nextDate}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToday}>
                오늘
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={timeSlot}
            onValueChange={(v) => setTimeSlot(v as TimeSlot)}
          >
            <TabsList>
              {(Object.entries(TIME_SLOT_MAP) as [TimeSlot, string][]).map(
                ([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : studentLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <NotebookPen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-sm text-slate-400">
                    배정된 학생이 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Condition Summary Bar */}
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700">
                        컨디션 분포
                      </h3>
                      <span className="text-xs text-slate-500">
                        {studentLogs.length}명 중{" "}
                        {Object.values(conditionCounts).reduce(
                          (a, b) => a + b,
                          0
                        )}
                        명 입력
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {CONDITION_OPTIONS.map((opt) => (
                        <div key={opt.value} className="flex items-center gap-1.5">
                          <span
                            className={`h-3 w-3 rounded-full ${CONDITION_BG[opt.value] ?? "bg-gray-300"}`}
                          />
                          <span className="text-xs text-slate-600">
                            {opt.label}
                          </span>
                          <span className="text-xs font-semibold">
                            {conditionCounts[opt.value] ?? 0}명
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Batch condition */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500">일괄 설정:</span>
                      {CONDITION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleBatchCondition(opt.value)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${CONDITION_BG[opt.value] ?? "bg-gray-300"} text-white hover:opacity-80`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Student Log Cards */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {studentLogs.map((state) => (
                      <Card key={state.studentId} className="py-4">
                        <CardHeader className="pb-0">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-semibold">
                              {state.studentName}
                            </span>
                            {state.logId && (
                              <Badge variant="outline" className="text-xs">
                                저장됨
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-3">
                          {/* Condition selector */}
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-slate-500">
                              컨디션
                            </p>
                            <div className="flex gap-1.5">
                              {CONDITION_OPTIONS.map((opt) => {
                                const isSelected =
                                  state.condition === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() =>
                                      handleConditionChange(
                                        state.studentId,
                                        opt.value
                                      )
                                    }
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                                      isSelected
                                        ? `${CONDITION_BG[opt.value] ?? "bg-gray-400"} text-white ring-2 ${CONDITION_RING[opt.value] ?? "ring-gray-400"} ring-offset-1`
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Content textarea */}
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-slate-500">
                              메모
                            </p>
                            <Textarea
                              value={state.content}
                              onChange={(e) =>
                                handleContentChange(
                                  state.studentId,
                                  e.target.value
                                )
                              }
                              placeholder="훈련 내용, 특이사항 등"
                              rows={2}
                              className="text-sm"
                            />
                          </div>

                          {/* Save */}
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant={state.dirty ? "default" : "outline"}
                              disabled={state.saving || !state.dirty}
                              onClick={() => handleSaveLog(state.studentId)}
                            >
                              <Save className="h-3 w-3" />
                              {state.saving ? "저장 중..." : "저장"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
