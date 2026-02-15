"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { instructorsAPI } from "@/lib/api/instructors";

interface Instructor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  is_active?: boolean;
  created_at: string;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  specialty: "",
};

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Instructor | null>(null);
  const [editTarget, setEditTarget] = useState<Instructor | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function fetchInstructors() {
    setLoading(true);
    try {
      const { data } = await instructorsAPI.list();
      setInstructors(data.items ?? data ?? []);
    } catch {
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInstructors();
  }, []);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(instructor: Instructor) {
    setEditTarget(instructor);
    setForm({
      name: instructor.name,
      phone: instructor.phone ?? "",
      email: instructor.email ?? "",
      specialty: instructor.specialty ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      if (editTarget) {
        await instructorsAPI.update(editTarget.id, form);
        toast.success("강사 정보가 수정되었습니다");
      } else {
        await instructorsAPI.create(form);
        toast.success("강사가 등록되었습니다");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditTarget(null);
      fetchInstructors();
    } catch {
      toast.error(editTarget ? "수정에 실패했습니다" : "등록에 실패했습니다");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await instructorsAPI.delete(deleteTarget.id);
      toast.success("강사가 삭제되었습니다");
      setDeleteTarget(null);
      fetchInstructors();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">강사관리</h1>
          <p className="text-sm text-slate-500">
            강사 정보를 관리합니다 ({instructors.length}명)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          강사 등록
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : instructors.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              등록된 강사가 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전문분야</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium text-slate-900">
                      {inst.name}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {inst.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {inst.phone}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {inst.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {inst.email}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {inst.specialty ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          inst.is_active !== false
                            ? "bg-green-50 text-green-600"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {inst.is_active !== false ? "활동중" : "비활동"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(inst)}
                        >
                          <Pencil className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(inst)}
                        >
                          <Trash2 className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "강사 수정" : "강사 등록"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="강사 이름"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>전문분야</Label>
              <Input
                value={form.specialty}
                onChange={(e) =>
                  setForm({ ...form, specialty: e.target.value })
                }
                placeholder="예: 수영, 축구, 태권도"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name}>
              {editTarget ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>강사 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; 강사를 삭제하시겠습니까?
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
