"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FileText, Calendar } from "lucide-react";
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
import { plansAPI } from "@/lib/api/training";
import type { TrainingPlan } from "@/lib/types/training";

export default function PlansPage() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    start_date: "",
    end_date: "",
    exercises: "",
    memo: "",
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await plansAPI.list();
      setPlans(data as TrainingPlan[]);
    } catch {
      toast.error("훈련계획을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = async () => {
    try {
      const exercises = form.exercises
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
        .map((name) => ({ exercise_name: name }));
      await plansAPI.create({
        student_name: form.student_name,
        start_date: form.start_date,
        end_date: form.end_date,
        exercises,
        memo: form.memo,
      });
      setShowDialog(false);
      setForm({
        student_name: "",
        start_date: "",
        end_date: "",
        exercises: "",
        memo: "",
      });
      toast.success("훈련계획이 생성되었습니다");
      fetchPlans();
    } catch {
      toast.error("생성에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">훈련계획</h1>
          <p className="text-sm text-slate-500">
            학생별 훈련계획을 관리합니다
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus />
          계획 생성
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : plans.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          등록된 훈련계획이 없습니다
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-blue-500" />
                  {plan.student_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {plan.start_date} ~ {plan.end_date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {plan.exercises.map((ex, i) => (
                    <Badge key={i} variant="secondary">
                      {ex.exercise_name}
                    </Badge>
                  ))}
                </div>
                {plan.memo && (
                  <p className="mt-3 text-xs text-slate-500">{plan.memo}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>훈련계획 생성</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>학생 이름</Label>
              <Input
                value={form.student_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, student_name: e.target.value }))
                }
                placeholder="학생 이름"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>운동 항목 (쉼표 구분)</Label>
              <Input
                value={form.exercises}
                onChange={(e) =>
                  setForm((f) => ({ ...f, exercises: e.target.value }))
                }
                placeholder="100m 달리기, 제자리멀리뛰기, 배근력"
              />
            </div>
            <div className="grid gap-2">
              <Label>메모</Label>
              <Input
                value={form.memo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, memo: e.target.value }))
                }
                placeholder="메모 (선택)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
