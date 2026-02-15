"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trophy, Calendar } from "lucide-react";
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
import { testsAPI } from "@/lib/api/training";
import type { MonthlyTest } from "@/lib/types/training";
import { TEST_STATUS_MAP } from "@/lib/types/training";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  active: "default",
  completed: "secondary",
};

export default function TestsPage() {
  const [tests, setTests] = useState<MonthlyTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", date: "" });

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await testsAPI.list();
      setTests(data as MonthlyTest[]);
    } catch {
      toast.error("테스트 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCreate = async () => {
    try {
      await testsAPI.create({ name: form.name, date: form.date });
      setShowDialog(false);
      setForm({ name: "", date: "" });
      toast.success("테스트가 생성되었습니다");
      fetchTests();
    } catch {
      toast.error("생성에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">월간테스트</h1>
          <p className="text-sm text-slate-500">
            월간 체력 테스트를 관리합니다
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus />
          테스트 생성
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : tests.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          등록된 테스트가 없습니다
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Link
              key={test.id}
              href={`/training/tests/${test.id}`}
              className="block"
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    {test.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {test.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={STATUS_VARIANT[test.status] ?? "outline"}>
                    {TEST_STATUS_MAP[test.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 생성</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>테스트명</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="2024년 1월 체력 테스트"
              />
            </div>
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
