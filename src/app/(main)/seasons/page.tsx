"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { seasonsAPI } from "@/lib/api/seasons";

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  student_count?: number;
  is_active?: boolean;
  created_at: string;
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Season | null>(null);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  async function fetchSeasons() {
    setLoading(true);
    try {
      const { data } = await seasonsAPI.list();
      setSeasons(data.items ?? data ?? []);
    } catch {
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSeasons();
  }, []);

  async function handleCreate() {
    try {
      await seasonsAPI.create(form);
      toast.success("시즌이 등록되었습니다");
      setCreateOpen(false);
      setForm({ name: "", start_date: "", end_date: "" });
      fetchSeasons();
    } catch {
      toast.error("시즌 등록에 실패했습니다");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await seasonsAPI.delete(deleteTarget.id);
      toast.success("시즌이 삭제되었습니다");
      setDeleteTarget(null);
      fetchSeasons();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">시즌관리</h1>
          <p className="text-sm text-slate-500">
            학기/시즌별 학생 등록을 관리합니다
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              시즌 등록
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>시즌 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>시즌 이름</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="예: 2026 봄학기"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료일</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={!form.name}>
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : seasons.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              등록된 시즌이 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시즌 이름</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>학생 수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((s) => {
                  const now = new Date();
                  const start = new Date(s.start_date);
                  const end = new Date(s.end_date);
                  const isActive = s.is_active ?? (now >= start && now <= end);

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-900">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(s.start_date).toLocaleDateString("ko-KR")}{" "}
                          ~ {new Date(s.end_date).toLocaleDateString("ko-KR")}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {s.student_count ?? 0}명
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            isActive
                              ? "bg-green-50 text-green-600"
                              : "bg-slate-100 text-slate-500"
                          }
                        >
                          {isActive ? "진행중" : "종료"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/seasons/${s.id}/enroll`}>
                              학생 등록
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(s)}
                          >
                            <Trash2 className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시즌 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; 시즌을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
