"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  plansAPI,
  exercisesAPI,
  presetsAPI,
  packsAPI,
} from "@/lib/api/training";
import type {
  DailyPlan,
  Exercise,
  TrainingPreset,
  ExercisePack,
} from "@/lib/types/training";
import { TIME_SLOT_MAP } from "@/lib/types/training";

type TimeSlot = "morning" | "afternoon" | "evening";

interface PlanExercise {
  exercise_id: number;
  name: string;
  sets?: number;
  reps?: number;
  memo?: string;
}

function parseExercises(json: string | null): PlanExercise[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PlansPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Create/edit dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [tags, setTags] = useState("");
  const [conditions, setConditions] = useState("");

  // Exercise library dialog
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");

  // Presets & Packs
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [packs, setPacks] = useState<ExercisePack[]>([]);

  // Load plan for date + time_slot
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await plansAPI.list({ date, time_slot: timeSlot });
      const plans = data as DailyPlan[];
      setPlan(plans.length > 0 ? plans[0] : null);
    } catch {
      toast.error("수업 계획을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [date, timeSlot]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Load exercise library, presets, packs
  useEffect(() => {
    (async () => {
      try {
        const [exRes, presetRes, packRes] = await Promise.all([
          exercisesAPI.list(),
          presetsAPI.list(),
          packsAPI.list(),
        ]);
        setAllExercises(exRes.data as Exercise[]);
        setPresets(presetRes.data as TrainingPreset[]);
        setPacks(packRes.data as ExercisePack[]);
      } catch {
        // Silent fail - exercise library is supplementary
      }
    })();
  }, []);

  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  // Open create dialog
  const openCreate = () => {
    setExercises([]);
    setTags("");
    setConditions("");
    setShowCreateDialog(true);
  };

  // Start editing existing plan
  const startEdit = () => {
    if (!plan) return;
    setExercises(parseExercises(plan.exercises));
    setTags(parseTags(plan.tags).join(", "));
    setConditions(plan.conditions ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  // Add exercise from library
  const addExercise = (ex: Exercise) => {
    if (exercises.some((e) => e.exercise_id === ex.id)) return;
    setExercises((prev) => [
      ...prev,
      { exercise_id: ex.id, name: ex.name },
    ]);
  };

  // Remove exercise
  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  // Move exercise up/down
  const moveExercise = (idx: number, dir: "up" | "down") => {
    setExercises((prev) => {
      const next = [...prev];
      const targetIdx = dir === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === Number(presetId));
    if (!preset) return;
    const presetExercises = parseExercises(preset.exercises);
    setExercises(presetExercises);
    const presetTags = parseTags(preset.tags);
    if (presetTags.length > 0) setTags(presetTags.join(", "));
    toast.success(`프리셋 "${preset.name}" 적용됨`);
  };

  // Apply pack
  const applyPack = (packId: string) => {
    const pack = packs.find((p) => p.id === Number(packId));
    if (!pack) return;
    const packExercises = parseExercises(pack.exercises);
    setExercises((prev) => {
      const existingIds = new Set(prev.map((e) => e.exercise_id));
      const newOnes = packExercises.filter(
        (e) => !existingIds.has(e.exercise_id)
      );
      return [...prev, ...newOnes];
    });
    toast.success(`팩 "${pack.name}" 적용됨`);
  };

  // Create plan
  const handleCreate = async () => {
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await plansAPI.create({
        date,
        time_slot: timeSlot,
        exercises: JSON.stringify(exercises),
        tags: JSON.stringify(tagList),
        conditions,
      });
      setShowCreateDialog(false);
      toast.success("수업 계획이 등록되었습니다");
      fetchPlan();
    } catch {
      toast.error("등록에 실패했습니다");
    }
  };

  // Save edited plan
  const handleSaveEdit = async () => {
    if (!plan) return;
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await plansAPI.update(plan.id, {
        exercises: JSON.stringify(exercises),
        tags: JSON.stringify(tagList),
        conditions,
      });
      setEditing(false);
      toast.success("수업 계획이 수정되었습니다");
      fetchPlan();
    } catch {
      toast.error("수정에 실패했습니다");
    }
  };

  // Add extra exercise to existing plan
  const handleAddExtra = async (ex: Exercise) => {
    if (!plan) return;
    try {
      await plansAPI.addExtra(plan.id, {
        exercise: { exercise_id: ex.id, name: ex.name },
      });
      toast.success(`"${ex.name}" 추가됨`);
      setShowExerciseDialog(false);
      fetchPlan();
    } catch {
      toast.error("운동 추가에 실패했습니다");
    }
  };

  // Delete plan
  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm("이 수업 계획을 삭제하시겠습니까?")) return;
    try {
      await plansAPI.delete(plan.id);
      toast.success("수업 계획이 삭제되었습니다");
      setPlan(null);
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  const prevDate = () =>
    setDate((prev) => format(subDays(parseISO(prev), 1), "yyyy-MM-dd"));
  const nextDate = () =>
    setDate((prev) => format(addDays(parseISO(prev), 1), "yyyy-MM-dd"));
  const goToday = () => setDate(format(new Date(), "yyyy-MM-dd"));

  const planExercises = plan ? parseExercises(plan.exercises) : [];
  const planTags = plan ? parseTags(plan.tags) : [];

  const TAG_COLORS: Record<string, string> = {
    "웜업": "bg-orange-100 text-orange-700",
    "측정": "bg-blue-100 text-blue-700",
    "체력": "bg-green-100 text-green-700",
    "기술": "bg-purple-100 text-purple-700",
    "쿨다운": "bg-cyan-100 text-cyan-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수업 계획</h1>
          <p className="text-sm text-slate-500">
            일별 수업 계획을 관리합니다
          </p>
        </div>
      </div>

      {/* Date Nav + Time Slot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
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
            onValueChange={(v) => {
              setTimeSlot(v as TimeSlot);
              setEditing(false);
            }}
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
              ) : !plan ? (
                // No plan exists
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="mb-4 text-sm text-slate-400">
                    이 날짜/시간대에 등록된 수업 계획이 없습니다
                  </p>
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    수업 계획 등록
                  </Button>
                </div>
              ) : editing ? (
                // Edit mode
                <div className="space-y-6">
                  {/* Exercise list with reorder */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        운동 목록 ({exercises.length}개)
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExerciseDialog(true)}
                      >
                        <Plus className="h-3 w-3" />
                        운동 추가
                      </Button>
                    </div>
                    {exercises.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-400">
                        운동을 추가해주세요
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {exercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg border bg-white p-3"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-sm font-medium">
                              {ex.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={idx === 0}
                                onClick={() => moveExercise(idx, "up")}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={idx === exercises.length - 1}
                                onClick={() => moveExercise(idx, "down")}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-700"
                                onClick={() => removeExercise(idx)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="grid gap-2">
                    <Label>태그 (쉼표 구분)</Label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="웜업, 측정, 체력"
                    />
                  </div>

                  {/* Conditions */}
                  <div className="grid gap-2">
                    <Label>유의사항</Label>
                    <Textarea
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      placeholder="수업 시 유의사항을 입력하세요"
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSaveEdit}>저장</Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="space-y-6">
                  {/* Exercises */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700">
                        운동 목록 ({planExercises.length}개)
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExerciseDialog(true)}
                        >
                          <Plus className="h-3 w-3" />
                          운동 추가
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startEdit}
                        >
                          <Pencil className="h-3 w-3" />
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-3 w-3" />
                          삭제
                        </Button>
                      </div>
                    </div>
                    {planExercises.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-400">
                        등록된 운동이 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {planExercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-lg border bg-white p-3"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium">
                              {ex.name}
                            </span>
                            {ex.sets && (
                              <Badge variant="secondary" className="text-xs">
                                {ex.sets}세트
                              </Badge>
                            )}
                            {ex.reps && (
                              <Badge variant="secondary" className="text-xs">
                                {ex.reps}회
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {planTags.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-slate-700">
                        태그
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {planTags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className={TAG_COLORS[tag] ?? ""}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  {plan.conditions && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-slate-700">
                        유의사항
                      </h3>
                      <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600 whitespace-pre-wrap">
                        {plan.conditions}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>수업 계획 등록</DialogTitle>
            <CardDescription>
              {date} / {TIME_SLOT_MAP[timeSlot]}
            </CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Preset / Pack */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>프리셋 적용</Label>
                <Select onValueChange={applyPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="프리셋 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>팩 적용</Label>
                <Select onValueChange={applyPack}>
                  <SelectTrigger>
                    <SelectValue placeholder="팩 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {packs.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exercise list */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>운동 목록 ({exercises.length}개)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExerciseDialog(true)}
                >
                  <Plus className="h-3 w-3" />
                  추가
                </Button>
              </div>
              {exercises.length === 0 ? (
                <p className="py-3 text-center text-sm text-slate-400">
                  운동을 추가해주세요
                </p>
              ) : (
                <div className="max-h-[200px] space-y-1.5 overflow-y-auto">
                  {exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded border p-2"
                    >
                      <span className="text-xs font-medium text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm">{ex.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => moveExercise(idx, "up")}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === exercises.length - 1}
                        onClick={() => moveExercise(idx, "down")}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeExercise(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label>태그 (쉼표 구분)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="웜업, 측정, 체력"
              />
            </div>

            {/* Conditions */}
            <div className="grid gap-2">
              <Label>유의사항</Label>
              <Textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="수업 시 유의사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleCreate}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Library Dialog */}
      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>운동 선택</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="운동 검색..."
                className="pl-9"
              />
            </div>
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  검색 결과가 없습니다
                </p>
              ) : (
                filteredExercises.map((ex) => {
                  const alreadyAdded = exercises.some(
                    (e) => e.exercise_id === ex.id
                  );
                  return (
                    <div
                      key={ex.id}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                        alreadyAdded
                          ? "border-green-200 bg-green-50"
                          : "cursor-pointer hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        if (!alreadyAdded) {
                          if (editing && plan) {
                            handleAddExtra(ex);
                          } else {
                            addExercise(ex);
                          }
                        }
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{ex.name}</p>
                        {ex.description && (
                          <p className="text-xs text-slate-500">
                            {ex.description}
                          </p>
                        )}
                      </div>
                      {alreadyAdded ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          추가됨
                        </Badge>
                      ) : (
                        <Plus className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
