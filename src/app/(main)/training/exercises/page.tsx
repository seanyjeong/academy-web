"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Dumbbell,
  Search,
  Lock,
  Tag,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowRight,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { exercisesAPI, tagsAPI, packsAPI, plansAPI } from "@/lib/api/training";
import type {
  Exercise,
  ExerciseTag,
  ExercisePack,
  DailyPlan,
} from "@/lib/types/training";

const TAG_COLORS = [
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "gray", label: "Gray", class: "bg-gray-500" },
];

function getTagColorClass(color: string | null): string {
  return TAG_COLORS.find((c) => c.value === color)?.class ?? "bg-gray-400";
}

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ExercisesPage() {
  const [tab, setTab] = useState("exercises");

  // Exercises state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<number | null>(null);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({ name: "", description: "" });

  // Tags state
  const [tags, setTags] = useState<ExerciseTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<ExerciseTag | null>(null);
  const [tagForm, setTagForm] = useState({ name: "", color: "blue" });

  // Packs state
  const [packs, setPacks] = useState<ExercisePack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [showPackDialog, setShowPackDialog] = useState(false);
  const [editingPack, setEditingPack] = useState<ExercisePack | null>(null);
  const [packForm, setPackForm] = useState({
    name: "",
    selectedExerciseIds: [] as number[],
    selectedTagIds: [] as number[],
  });
  const [expandedPackId, setExpandedPackId] = useState<number | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyingPackId, setApplyingPackId] = useState<number | null>(null);
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Fetch functions
  const fetchExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const { data } = await exercisesAPI.list();
      setExercises(data as Exercise[]);
    } catch {
      toast.error("운동 목록을 불러오지 못했습니다");
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const { data } = await tagsAPI.list();
      setTags(data as ExerciseTag[]);
    } catch {
      toast.error("태그를 불러오지 못했습니다");
    } finally {
      setLoadingTags(false);
    }
  }, []);

  const fetchPacks = useCallback(async () => {
    setLoadingPacks(true);
    try {
      const { data } = await packsAPI.list();
      setPacks(data as ExercisePack[]);
    } catch {
      toast.error("팩을 불러오지 못했습니다");
    } finally {
      setLoadingPacks(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
    fetchTags();
    fetchPacks();
  }, [fetchExercises, fetchTags, fetchPacks]);

  // Exercises tab
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      if (!ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      return activeTagFilter === null;
    });
  }, [exercises, search, activeTagFilter]);

  const openCreateExercise = () => {
    setEditingExercise(null);
    setExerciseForm({ name: "", description: "" });
    setShowExerciseDialog(true);
  };

  const openEditExercise = (ex: Exercise) => {
    setEditingExercise(ex);
    setExerciseForm({ name: ex.name, description: ex.description ?? "" });
    setShowExerciseDialog(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseForm.name.trim()) {
      toast.error("운동 이름을 입력하세요");
      return;
    }
    try {
      const payload = {
        name: exerciseForm.name.trim(),
        description: exerciseForm.description.trim() || undefined,
      };
      if (editingExercise) {
        await exercisesAPI.update(editingExercise.id, payload);
        toast.success("운동이 수정되었습니다");
      } else {
        await exercisesAPI.create(payload);
        toast.success("운동이 추가되었습니다");
      }
      setShowExerciseDialog(false);
      fetchExercises();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const handleDeleteExercise = async (id: number) => {
    if (!confirm("이 운동을 삭제하시겠습니까?")) return;
    try {
      await exercisesAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchExercises();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  // Tags tab
  const openCreateTag = () => {
    setEditingTag(null);
    setTagForm({ name: "", color: "blue" });
    setShowTagDialog(true);
  };

  const openEditTag = (tag: ExerciseTag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.name, color: tag.color ?? "blue" });
    setShowTagDialog(true);
  };

  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      toast.error("태그 이름을 입력하세요");
      return;
    }
    try {
      const payload = { name: tagForm.name.trim(), color: tagForm.color };
      if (editingTag) {
        await tagsAPI.update(editingTag.id, payload);
        toast.success("태그가 수정되었습니다");
      } else {
        await tagsAPI.create(payload);
        toast.success("태그가 추가되었습니다");
      }
      setShowTagDialog(false);
      fetchTags();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!confirm("이 태그를 삭제하시겠습니까?")) return;
    try {
      await tagsAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchTags();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  // Packs tab
  const openCreatePack = () => {
    setEditingPack(null);
    setPackForm({ name: "", selectedExerciseIds: [], selectedTagIds: [] });
    setShowPackDialog(true);
  };

  const openEditPack = (pack: ExercisePack) => {
    setEditingPack(pack);
    const exerciseIds = parseJsonArray(pack.exercises).map(Number).filter(Boolean);
    const tagIds = parseJsonArray(pack.tags).map(Number).filter(Boolean);
    setPackForm({
      name: pack.name,
      selectedExerciseIds: exerciseIds,
      selectedTagIds: tagIds,
    });
    setShowPackDialog(true);
  };

  const handleSavePack = async () => {
    if (!packForm.name.trim()) {
      toast.error("팩 이름을 입력하세요");
      return;
    }
    try {
      const payload = {
        name: packForm.name.trim(),
        exercises: JSON.stringify(packForm.selectedExerciseIds),
        tags: JSON.stringify(packForm.selectedTagIds),
      };
      if (editingPack) {
        await packsAPI.update(editingPack.id, payload);
        toast.success("팩이 수정되었습니다");
      } else {
        await packsAPI.create(payload);
        toast.success("팩이 생성되었습니다");
      }
      setShowPackDialog(false);
      fetchPacks();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const handleDeletePack = async (id: number) => {
    if (!confirm("이 팩을 삭제하시겠습니까?")) return;
    try {
      await packsAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchPacks();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  const openApplyDialog = async (packId: number) => {
    setApplyingPackId(packId);
    setSelectedPlanId("");
    try {
      const { data } = await plansAPI.list();
      setPlans(data as DailyPlan[]);
    } catch {
      toast.error("플랜 목록을 불러오지 못했습니다");
    }
    setShowApplyDialog(true);
  };

  const handleApplyPack = async () => {
    if (!applyingPackId || !selectedPlanId) {
      toast.error("플랜을 선택하세요");
      return;
    }
    try {
      await packsAPI.apply(applyingPackId, { plan_id: Number(selectedPlanId) });
      toast.success("팩이 플랜에 적용되었습니다");
      setShowApplyDialog(false);
    } catch {
      toast.error("적용에 실패했습니다");
    }
  };

  const toggleExerciseInPack = (exerciseId: number) => {
    setPackForm((f) => ({
      ...f,
      selectedExerciseIds: f.selectedExerciseIds.includes(exerciseId)
        ? f.selectedExerciseIds.filter((id) => id !== exerciseId)
        : [...f.selectedExerciseIds, exerciseId],
    }));
  };

  const toggleTagInPack = (tagId: number) => {
    setPackForm((f) => ({
      ...f,
      selectedTagIds: f.selectedTagIds.includes(tagId)
        ? f.selectedTagIds.filter((id) => id !== tagId)
        : [...f.selectedTagIds, tagId],
    }));
  };

  const getPackExerciseNames = (pack: ExercisePack): string[] => {
    const ids = parseJsonArray(pack.exercises).map(Number);
    return ids
      .map((id) => exercises.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const getPackTagNames = (pack: ExercisePack): ExerciseTag[] => {
    const ids = parseJsonArray(pack.tags).map(Number);
    return ids
      .map((id) => tags.find((t) => t.id === id))
      .filter(Boolean) as ExerciseTag[];
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">운동 라이브러리</h1>
        <p className="text-sm text-slate-500">
          운동, 태그, 팩을 관리합니다
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="exercises">
            <Dumbbell className="mr-1.5 h-4 w-4" />
            운동 목록
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="mr-1.5 h-4 w-4" />
            태그 관리
          </TabsTrigger>
          <TabsTrigger value="packs">
            <Package className="mr-1.5 h-4 w-4" />
            팩 관리
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Exercises */}
        <TabsContent value="exercises">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="운동 검색..."
                  className="w-[220px] pl-9"
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={activeTagFilter === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setActiveTagFilter(null)}
                  >
                    전체
                  </Badge>
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={activeTagFilter === tag.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        setActiveTagFilter(
                          activeTagFilter === tag.id ? null : tag.id
                        )
                      }
                    >
                      <span
                        className={`mr-1 inline-block h-2 w-2 rounded-full ${getTagColorClass(tag.color)}`}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={openCreateExercise}>
              <Plus className="mr-1 h-4 w-4" />
              운동 추가
            </Button>
          </div>

          {loadingExercises ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 운동이 없습니다
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredExercises.map((ex) => (
                <Card key={ex.id} className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Dumbbell className="h-4 w-4 text-purple-500" />
                      {ex.name}
                      {ex.is_system && (
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </CardTitle>
                    {ex.is_system && (
                      <CardDescription>
                        <Badge variant="secondary" className="text-xs">
                          시스템 운동
                        </Badge>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {ex.description && (
                      <p className="mb-3 text-xs text-slate-500">
                        {ex.description}
                      </p>
                    )}
                    {!ex.is_system && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditExercise(ex)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteExercise(ex.id)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          삭제
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Tags */}
        <TabsContent value="tags">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              운동에 사용할 태그를 관리합니다
            </p>
            <Button onClick={openCreateTag}>
              <Plus className="mr-1 h-4 w-4" />
              태그 추가
            </Button>
          </div>

          {loadingTags ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : tags.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 태그가 없습니다
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {tags.map((tag) => (
                <Card key={tag.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-4 w-4 rounded-full ${getTagColorClass(tag.color)}`}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditTag(tag)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Packs */}
        <TabsContent value="packs">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              운동 팩을 관리합니다
            </p>
            <Button onClick={openCreatePack}>
              <Plus className="mr-1 h-4 w-4" />
              팩 생성
            </Button>
          </div>

          {loadingPacks ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : packs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 팩이 없습니다
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packs.map((pack) => {
                const exerciseNames = getPackExerciseNames(pack);
                const packTags = getPackTagNames(pack);
                const isExpanded = expandedPackId === pack.id;
                return (
                  <Card key={pack.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          {pack.name}
                        </span>
                        <Badge variant="secondary">
                          {exerciseNames.length}개 운동
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {packTags.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {packTags.map((t) => (
                            <Badge key={t.id} variant="outline" className="text-xs">
                              <span
                                className={`mr-1 inline-block h-2 w-2 rounded-full ${getTagColorClass(t.color)}`}
                              />
                              {t.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <button
                        className="mb-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        onClick={() =>
                          setExpandedPackId(isExpanded ? null : pack.id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        운동 {isExpanded ? "접기" : "펼치기"}
                      </button>

                      {isExpanded && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {exerciseNames.length > 0 ? (
                            exerciseNames.map((name) => (
                              <Badge key={name} variant="secondary" className="text-xs">
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
                          onClick={() => openEditPack(pack)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePack(pack.id)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          삭제
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openApplyDialog(pack.id)}
                        >
                          <ArrowRight className="mr-1 h-3.5 w-3.5" />
                          플랜에 적용
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Exercise Dialog */}
      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? "운동 수정" : "운동 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingExercise
                ? "운동 정보를 수정합니다"
                : "새 운동을 추가합니다"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>이름</Label>
              <Input
                value={exerciseForm.name}
                onChange={(e) =>
                  setExerciseForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="운동 이름"
              />
            </div>
            <div className="grid gap-2">
              <Label>설명</Label>
              <Input
                value={exerciseForm.description}
                onChange={(e) =>
                  setExerciseForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="운동 설명 (선택)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExerciseDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleSaveExercise}>
              {editingExercise ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "태그 수정" : "태그 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? "태그 정보를 수정합니다" : "새 태그를 추가합니다"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>이름</Label>
              <Input
                value={tagForm.name}
                onChange={(e) =>
                  setTagForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="태그 이름"
              />
            </div>
            <div className="grid gap-2">
              <Label>색상</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-8 w-8 rounded-full ${color.class} transition-all ${
                      tagForm.color === color.value
                        ? "ring-2 ring-offset-2 ring-slate-900"
                        : "hover:ring-2 hover:ring-offset-1 hover:ring-slate-300"
                    }`}
                    onClick={() =>
                      setTagForm((f) => ({ ...f, color: color.value }))
                    }
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveTag}>
              {editingTag ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pack Dialog */}
      <Dialog open={showPackDialog} onOpenChange={setShowPackDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPack ? "팩 수정" : "팩 생성"}
            </DialogTitle>
            <DialogDescription>
              {editingPack
                ? "팩 정보를 수정합니다"
                : "새 운동 팩을 생성합니다"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>이름</Label>
              <Input
                value={packForm.name}
                onChange={(e) =>
                  setPackForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="팩 이름"
              />
            </div>
            <div className="grid gap-2">
              <Label>운동 선택</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {exercises.length === 0 ? (
                  <p className="text-sm text-slate-400">운동이 없습니다</p>
                ) : (
                  exercises.map((ex) => (
                    <label
                      key={ex.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={packForm.selectedExerciseIds.includes(ex.id)}
                        onCheckedChange={() => toggleExerciseInPack(ex.id)}
                      />
                      <span className="text-sm">{ex.name}</span>
                      {ex.is_system && (
                        <Lock className="h-3 w-3 text-slate-400" />
                      )}
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-400">
                {packForm.selectedExerciseIds.length}개 선택됨
              </p>
            </div>
            <div className="grid gap-2">
              <Label>태그 선택</Label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-slate-400">태그가 없습니다</p>
                ) : (
                  tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        packForm.selectedTagIds.includes(tag.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTagInPack(tag.id)}
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
            <Button variant="outline" onClick={() => setShowPackDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSavePack}>
              {editingPack ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Pack to Plan Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플랜에 팩 적용</DialogTitle>
            <DialogDescription>
              팩의 운동을 적용할 플랜을 선택하세요
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>플랜 선택</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="플랜을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.date} - {plan.time_slot}
                      {plan.class_id ? ` (${plan.class_id}반)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplyDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleApplyPack} disabled={!selectedPlanId}>
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
