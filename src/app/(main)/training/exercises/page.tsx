"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Dumbbell, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { exercisesAPI } from "@/lib/api/training";
import type { Exercise } from "@/lib/types/training";

const CATEGORIES = [
  "전체",
  "스프린트",
  "점프",
  "근력",
  "유연성",
  "지구력",
  "기타",
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [tagFilter, setTagFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "",
    tags: "",
    description: "",
  });

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await exercisesAPI.list();
      setExercises(data as Exercise[]);
    } catch {
      toast.error("운동 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const filteredExercises = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "전체" || ex.category === categoryFilter;
    const matchTag =
      !tagFilter || ex.tags.some((t) => t.includes(tagFilter));
    return matchSearch && matchCategory && matchTag;
  });

  const allTags = Array.from(new Set(exercises.flatMap((e) => e.tags)));

  const openCreate = () => {
    setEditingExercise(null);
    setForm({ name: "", category: "", unit: "", tags: "", description: "" });
    setShowDialog(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setForm({
      name: ex.name,
      category: ex.category,
      unit: ex.unit,
      tags: ex.tags.join(", "),
      description: ex.description ?? "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: form.description,
      };
      if (editingExercise) {
        await exercisesAPI.update(editingExercise.id, payload);
        toast.success("운동이 수정되었습니다");
      } else {
        await exercisesAPI.create(payload);
        toast.success("운동이 추가되었습니다");
      }
      setShowDialog(false);
      fetchExercises();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 운동을 삭제하시겠습니까?")) return;
    try {
      await exercisesAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchExercises();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">운동관리</h1>
          <p className="text-sm text-slate-500">훈련 운동 항목을 관리합니다</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          운동 추가
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="운동 검색..."
            className="w-[200px] pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={tagFilter === "" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTagFilter("")}
            >
              전체
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={tagFilter === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTagFilter(tag === tagFilter ? "" : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          등록된 운동이 없습니다
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredExercises.map((ex) => (
            <Card key={ex.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-4 w-4 text-purple-500" />
                  {ex.name}
                </CardTitle>
                <CardDescription>
                  {ex.category} / {ex.unit}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-1">
                  {ex.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {ex.description && (
                  <p className="mb-3 text-xs text-slate-500">
                    {ex.description}
                  </p>
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(ex)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(ex.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? "운동 수정" : "운동 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>이름</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="운동 이름"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>카테고리</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "전체").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>단위</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="초, cm, kg, 회"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>태그 (쉼표 구분)</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="하체, 측정항목"
              />
            </div>
            <div className="grid gap-2">
              <Label>설명</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="운동 설명 (선택)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>
              {editingExercise ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
