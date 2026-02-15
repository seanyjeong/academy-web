"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
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
import { presetsAPI } from "@/lib/api/training";
import type { Preset } from "@/lib/types/training";

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    exercises: "",
  });

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await presetsAPI.list();
      setPresets(data as Preset[]);
    } catch {
      toast.error("프리셋을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const openCreate = () => {
    setEditingPreset(null);
    setForm({ name: "", description: "", exercises: "" });
    setShowDialog(true);
  };

  const openEdit = (preset: Preset) => {
    setEditingPreset(preset);
    setForm({
      name: preset.name,
      description: preset.description ?? "",
      exercises: preset.exercises.map((e) => e.exercise_name).join(", "),
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const exercises = form.exercises
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
        .map((name) => ({ exercise_name: name }));
      const payload = {
        name: form.name,
        description: form.description,
        exercises,
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
          <Plus />
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
          {presets.map((preset) => (
            <Card key={preset.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-orange-500" />
                  {preset.name}
                </CardTitle>
                <CardDescription>
                  {preset.exercises.length}개 운동
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-1">
                  {preset.exercises.map((ex, i) => (
                    <Badge key={i} variant="secondary">
                      {ex.exercise_name}
                    </Badge>
                  ))}
                </div>
                {preset.description && (
                  <p className="mb-3 text-xs text-slate-500">
                    {preset.description}
                  </p>
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(preset)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(preset.id)}
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
              {editingPreset ? "프리셋 수정" : "프리셋 생성"}
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
                placeholder="프리셋 이름"
              />
            </div>
            <div className="grid gap-2">
              <Label>운동 항목 (쉼표 구분)</Label>
              <Input
                value={form.exercises}
                onChange={(e) =>
                  setForm((f) => ({ ...f, exercises: e.target.value }))
                }
                placeholder="100m 달리기, 배근력, 윗몸일으키기"
              />
            </div>
            <div className="grid gap-2">
              <Label>설명</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="프리셋 설명 (선택)"
              />
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
