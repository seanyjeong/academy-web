"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  Copy,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { presetsAPI, exercisesAPI, tagsAPI } from "@/lib/api/training";
import type {
  TrainingPreset,
  Exercise,
  ExerciseTag,
} from "@/lib/types/training";

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const TAG_COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  gray: "bg-gray-500",
};

function getTagColorClass(color: string | null): string {
  return TAG_COLOR_MAP[color ?? ""] ?? "bg-gray-400";
}

export default function PresetsPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [tags, setTags] = useState<ExerciseTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<TrainingPreset | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    selectedExerciseIds: [] as number[],
    selectedTagIds: [] as number[],
  });

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await presetsAPI.list();
      setPresets(data as TrainingPreset[]);
    } catch {
      toast.error("프리셋을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      const { data } = await exercisesAPI.list();
      setExercises(data as Exercise[]);
    } catch {
      // silent
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const { data } = await tagsAPI.list();
      setTags(data as ExerciseTag[]);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPresets();
    fetchExercises();
    fetchTags();
  }, [fetchPresets, fetchExercises, fetchTags]);

  const getPresetExerciseNames = (preset: TrainingPreset): string[] => {
    const ids = parseJsonArray(preset.exercises).map(Number);
    return ids
      .map((id) => exercises.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const getPresetTags = (preset: TrainingPreset): ExerciseTag[] => {
    const ids = parseJsonArray(preset.tags).map(Number);
    return ids
      .map((id) => tags.find((t) => t.id === id))
      .filter(Boolean) as ExerciseTag[];
  };

  const getExerciseCount = (preset: TrainingPreset): number => {
    return parseJsonArray(preset.exercises).length;
  };

  const openCreate = () => {
    setEditingPreset(null);
    setForm({ name: "", selectedExerciseIds: [], selectedTagIds: [] });
    setShowDialog(true);
  };

  const openEdit = (preset: TrainingPreset) => {
    setEditingPreset(preset);
    const exerciseIds = parseJsonArray(preset.exercises).map(Number).filter(Boolean);
    const tagIds = parseJsonArray(preset.tags).map(Number).filter(Boolean);
    setForm({
      name: preset.name,
      selectedExerciseIds: exerciseIds,
      selectedTagIds: tagIds,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("프리셋 이름을 입력하세요");
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        exercises: JSON.stringify(form.selectedExerciseIds),
        tags: JSON.stringify(form.selectedTagIds),
      };
      if (editingPreset) {
        await presetsAPI.update(editingPreset.id, payload);
        toast.success("프리셋이 수정되었습니다");
      } else {
        await presetsAPI.create(payload);
        toast.success("프리셋이 생성되었습니다");
      }
      setShowDialog(false);
      fetchPresets();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 프리셋을 삭제하시겠습니까?")) return;
    try {
      await presetsAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchPresets();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  const handleDuplicate = async (preset: TrainingPreset) => {
    try {
      await presetsAPI.create({
        name: `${preset.name} (복사)`,
        exercises: preset.exercises,
        tags: preset.tags,
      });
      toast.success("프리셋이 복사되었습니다");
      fetchPresets();
    } catch {
      toast.error("복사에 실패했습니다");
    }
  };

  const handleNavigateToPlan = () => {
    router.push("/training/plans");
  };

  const toggleExercise = (exerciseId: number) => {
    setForm((f) => ({
      ...f,
      selectedExerciseIds: f.selectedExerciseIds.includes(exerciseId)
        ? f.selectedExerciseIds.filter((id) => id !== exerciseId)
        : [...f.selectedExerciseIds, exerciseId],
    }));
  };

  const toggleTag = (tagId: number) => {
    setForm((f) => ({
      ...f,
      selectedTagIds: f.selectedTagIds.includes(tagId)
        ? f.selectedTagIds.filter((id) => id !== tagId)
        : [...f.selectedTagIds, tagId],
    }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">프리셋</h1>
          <p className="text-sm text-slate-500">
            자주 사용하는 운동 조합을 프리셋으로 관리합니다
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          프리셋 생성
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : presets.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          등록된 프리셋이 없습니다
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => {
            const exerciseNames = getPresetExerciseNames(preset);
            const presetTags = getPresetTags(preset);
            const isExpanded = expandedId === preset.id;

            return (
              <Card key={preset.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      {preset.name}
                    </span>
                    <Badge variant="secondary">
                      {getExerciseCount(preset)}개 운동
                    </Badge>
                  </CardTitle>
                  {presetTags.length > 0 && (
                    <CardDescription className="flex flex-wrap gap-1 pt-1">
                      {presetTags.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          <span
                            className={`mr-1 inline-block h-2 w-2 rounded-full ${getTagColorClass(tag.color)}`}
                          />
                          {tag.name}
                        </Badge>
                      ))}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <button
                    className="mb-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : preset.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    운동 {isExpanded ? "접기" : "보기"}
                  </button>

                  {isExpanded && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {exerciseNames.length > 0 ? (
                        exerciseNames.map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            <Dumbbell className="mr-1 h-3 w-3" />
                            {name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          운동이 없습니다
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(preset)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicate(preset)}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      복사
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(preset.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      삭제
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNavigateToPlan}
                    >
                      <ArrowRight className="mr-1 h-3.5 w-3.5" />
                      수업 계획 만들기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPreset ? "프리셋 수정" : "프리셋 생성"}
            </DialogTitle>
            <DialogDescription>
              {editingPreset
                ? "프리셋 정보를 수정합니다"
                : "새 프리셋을 생성합니다"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>이름</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="프리셋 이름"
              />
            </div>

            <div className="grid gap-2">
              <Label>운동 선택</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                {exercises.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    등록된 운동이 없습니다
                  </p>
                ) : (
                  exercises.map((ex) => (
                    <label
                      key={ex.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={form.selectedExerciseIds.includes(ex.id)}
                        onCheckedChange={() => toggleExercise(ex.id)}
                      />
                      <span className="text-sm">{ex.name}</span>
                      {ex.is_system && (
                        <Badge variant="secondary" className="text-[10px]">
                          시스템
                        </Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-400">
                {form.selectedExerciseIds.length}개 선택됨
              </p>
            </div>

            <div className="grid gap-2">
              <Label>태그 선택</Label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    등록된 태그가 없습니다
                  </p>
                ) : (
                  tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        form.selectedTagIds.includes(tag.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <span
                        className={`mr-1 inline-block h-2 w-2 rounded-full ${getTagColorClass(tag.color)}`}
                      />
                      {tag.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>
              {editingPreset ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
