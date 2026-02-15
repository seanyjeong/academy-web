"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, NotebookPen, Calendar } from "lucide-react";
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
import { logsAPI } from "@/lib/api/training";
import type { TrainingLog } from "@/lib/types/training";

export default function LogsPage() {
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    title: "",
    student_names: "",
    exercises_performed: "",
    notes: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await logsAPI.list();
      setLogs(data as TrainingLog[]);
    } catch {
      toast.error("훈련일지를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCreate = async () => {
    try {
      await logsAPI.create({
        date: form.date,
        title: form.title,
        student_names: form.student_names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        exercises_performed: form.exercises_performed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: form.notes,
      });
      setShowDialog(false);
      setForm({
        date: format(new Date(), "yyyy-MM-dd"),
        title: "",
        student_names: "",
        exercises_performed: "",
        notes: "",
      });
      toast.success("훈련일지가 생성되었습니다");
      fetchLogs();
    } catch {
      toast.error("생성에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">훈련일지</h1>
          <p className="text-sm text-slate-500">일별 훈련 내용을 기록합니다</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus />
          일지 작성
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          등록된 훈련일지가 없습니다
        </div>
      ) : (
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <NotebookPen className="h-4 w-4 text-green-500" />
                  {log.title || `${log.date} 훈련일지`}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {log.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {log.student_names && log.student_names.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      참여 학생
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {log.student_names.map((name, i) => (
                        <Badge key={i} variant="outline">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {log.exercises_performed.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      수행 운동
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {log.exercises_performed.map((ex, i) => (
                        <Badge key={i} variant="secondary">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {log.notes && (
                  <p className="text-sm text-slate-600">{log.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>훈련일지 작성</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>날짜</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>제목</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="훈련일지 제목"
              />
            </div>
            <div className="grid gap-2">
              <Label>참여 학생 (쉼표 구분)</Label>
              <Input
                value={form.student_names}
                onChange={(e) =>
                  setForm((f) => ({ ...f, student_names: e.target.value }))
                }
                placeholder="김철수, 이영희, 박민수"
              />
            </div>
            <div className="grid gap-2">
              <Label>수행 운동 (쉼표 구분)</Label>
              <Input
                value={form.exercises_performed}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    exercises_performed: e.target.value,
                  }))
                }
                placeholder="100m 달리기, 배근력 측정"
              />
            </div>
            <div className="grid gap-2">
              <Label>특이사항</Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="훈련 중 특이사항"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
