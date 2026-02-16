"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trophy,
  Calendar,
  Trash2,
  MoreVertical,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { testsAPI } from "@/lib/api/training";
import type { MonthlyTest } from "@/lib/types/training";
import { TEST_STATUS_MAP } from "@/lib/types/training";

type TestStatus = MonthlyTest["status"];

const STATUS_VARIANT: Record<TestStatus, "default" | "secondary" | "outline"> =
  {
    draft: "outline",
    active: "default",
    completed: "secondary",
  };

const STATUS_OPTIONS: { value: TestStatus; label: string }[] = [
  { value: "draft", label: "준비중" },
  { value: "active", label: "진행중" },
  { value: "completed", label: "완료" },
];

function formatYearMonth(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseYearMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}

function shiftMonth(ym: string, delta: number): string {
  const { year, month } = parseYearMonth(ym);
  const d = new Date(year, month - 1 + delta, 1);
  return formatYearMonth(d);
}

export default function TestsPage() {
  const [tests, setTests] = useState<MonthlyTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearMonth, setYearMonth] = useState(formatYearMonth(new Date()));

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", year_month: "" });

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<MonthlyTest | null>(null);
  const [editForm, setEditForm] = useState({ name: "", status: "" as string });

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonthlyTest | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await testsAPI.list({ year_month: yearMonth });
      setTests(Array.isArray(data) ? (data as MonthlyTest[]) : []);
    } catch {
      toast.error("테스트 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const ymLabel = useMemo(() => {
    const { year, month } = parseYearMonth(yearMonth);
    return `${year}년 ${month}월`;
  }, [yearMonth]);

  // --- Create ---
  const openCreate = () => {
    setCreateForm({ name: "", year_month: yearMonth });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("테스트명을 입력해주세요");
      return;
    }
    try {
      await testsAPI.create({
        name: createForm.name.trim(),
        year_month: createForm.year_month || yearMonth,
      });
      setShowCreate(false);
      toast.success("테스트가 생성되었습니다");
      fetchTests();
    } catch {
      toast.error("생성에 실패했습니다");
    }
  };

  // --- Edit ---
  const openEdit = (test: MonthlyTest) => {
    setEditTarget(test);
    setEditForm({ name: test.name, status: test.status });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      await testsAPI.update(editTarget.id, {
        name: editForm.name.trim(),
        status: editForm.status,
      });
      setShowEdit(false);
      toast.success("테스트가 수정되었습니다");
      fetchTests();
    } catch {
      toast.error("수정에 실패했습니다");
    }
  };

  // --- Delete ---
  const openDelete = (test: MonthlyTest) => {
    setDeleteTarget(test);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await testsAPI.delete(deleteTarget.id);
      setShowDelete(false);
      toast.success("테스트가 삭제되었습니다");
      fetchTests();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">월간테스트</h1>
          <p className="text-sm text-slate-500">
            월간 체력 테스트를 관리합니다
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          테스트 생성
        </Button>
      </div>

      {/* Year-Month Selector */}
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setYearMonth(shiftMonth(yearMonth, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[100px] text-center text-sm font-medium text-slate-700">
          {ymLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setYearMonth(shiftMonth(yearMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Input
          type="month"
          value={yearMonth}
          onChange={(e) => e.target.value && setYearMonth(e.target.value)}
          className="ml-2 w-[160px]"
        />
      </div>

      {/* Test Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : tests.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {ymLabel}에 등록된 테스트가 없습니다
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="group relative transition-shadow hover:shadow-md"
            >
              <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(test)}>
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => openDelete(test)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/training/tests/${test.id}`} className="block">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    {test.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {test.year_month}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={STATUS_VARIANT[test.status] ?? "outline"}>
                    {TEST_STATUS_MAP[test.status] ?? test.status}
                  </Badge>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 생성</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>테스트명</Label>
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="2026년 2월 체력 테스트"
              />
            </div>
            <div className="grid gap-2">
              <Label>연월</Label>
              <Input
                type="month"
                value={createForm.year_month}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, year_month: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>테스트명</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>상태</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              취소
            </Button>
            <Button onClick={handleEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 삭제</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-slate-600">
            &quot;{deleteTarget?.name}&quot; 테스트를 삭제하시겠습니까? 이
            작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
