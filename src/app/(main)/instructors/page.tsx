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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { instructorsAPI } from "@/lib/api/instructors";
import { formatKRW } from "@/lib/format";

interface Instructor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  instructor_type?: string;
  salary_type?: string;
  base_salary?: number;
  hourly_rate?: number;
  morning_class_rate?: number;
  afternoon_class_rate?: number;
  evening_class_rate?: number;
  tax_type?: string;
  status?: string;
  created_at: string;
}

const SALARY_TYPE_LABELS: Record<string, string> = {
  hourly: "시급",
  per_class: "건당",
  monthly: "월급",
  mixed: "혼합",
};

const SALARY_TYPE_COLORS: Record<string, string> = {
  hourly: "bg-blue-50 text-blue-600",
  per_class: "bg-amber-50 text-amber-600",
  monthly: "bg-green-50 text-green-600",
  mixed: "bg-purple-50 text-purple-600",
};

const TAX_TYPE_LABELS: Record<string, string> = {
  "3.3%": "3.3% 원천징수",
  insurance: "4대보험",
  none: "비과세",
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  instructor_type: "full_time" as string,
  salary_type: "per_class" as string,
  base_salary: 0,
  hourly_rate: 0,
  morning_class_rate: 0,
  afternoon_class_rate: 0,
  evening_class_rate: 0,
  tax_type: "3.3%" as string,
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

  function openEdit(inst: Instructor) {
    setEditTarget(inst);
    setForm({
      name: inst.name,
      phone: inst.phone ?? "",
      email: inst.email ?? "",
      instructor_type: inst.instructor_type ?? "full_time",
      salary_type: inst.salary_type ?? "per_class",
      base_salary: inst.base_salary ?? 0,
      hourly_rate: inst.hourly_rate ?? 0,
      morning_class_rate: inst.morning_class_rate ?? 0,
      afternoon_class_rate: inst.afternoon_class_rate ?? 0,
      evening_class_rate: inst.evening_class_rate ?? 0,
      tax_type: inst.tax_type ?? "3.3%",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        instructor_type: form.instructor_type,
        salary_type: form.salary_type,
        tax_type: form.tax_type,
      };
      // Set rates based on salary type
      if (form.salary_type === "monthly" || form.salary_type === "mixed") {
        payload.base_salary = form.base_salary;
      }
      if (form.salary_type === "hourly" || form.salary_type === "mixed") {
        payload.hourly_rate = form.hourly_rate;
      }
      if (form.salary_type === "per_class" || form.salary_type === "mixed") {
        payload.morning_class_rate = form.morning_class_rate;
        payload.afternoon_class_rate = form.afternoon_class_rate;
        payload.evening_class_rate = form.evening_class_rate;
      }

      if (editTarget) {
        await instructorsAPI.update(editTarget.id, payload);
        toast.success("강사 정보가 수정되었습니다");
      } else {
        await instructorsAPI.create(payload);
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

  function getSalaryDisplay(inst: Instructor): string {
    const type = inst.salary_type ?? "per_class";
    if (type === "monthly") return formatKRW(inst.base_salary ?? 0) + "/월";
    if (type === "hourly") return formatKRW(inst.hourly_rate ?? 0) + "/시간";
    if (type === "per_class") {
      const rates = [inst.morning_class_rate, inst.afternoon_class_rate, inst.evening_class_rate]
        .filter((r): r is number => r != null && r > 0);
      if (rates.length === 0) return "-";
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      return `~${formatKRW(avg)}/건`;
    }
    return formatKRW(inst.base_salary ?? 0) + "+α";
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
                  <TableHead>급여유형</TableHead>
                  <TableHead>급여단가</TableHead>
                  <TableHead>세금</TableHead>
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
                      ) : inst.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {inst.email}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={SALARY_TYPE_COLORS[inst.salary_type ?? "per_class"] ?? ""}
                      >
                        {SALARY_TYPE_LABELS[inst.salary_type ?? "per_class"] ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {getSalaryDisplay(inst)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {TAX_TYPE_LABELS[inst.tax_type ?? "3.3%"] ?? inst.tax_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          inst.status === "active" || inst.status == null
                            ? "bg-green-50 text-green-600"
                            : inst.status === "on_leave"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                        }
                      >
                        {inst.status === "active" || inst.status == null
                          ? "활동중"
                          : inst.status === "on_leave"
                            ? "휴직"
                            : "퇴직"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(inst)}>
                          <Pencil className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(inst)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "강사 수정" : "강사 등록"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이름 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="강사 이름"
                />
              </div>
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>근무유형</Label>
                <Select
                  value={form.instructor_type}
                  onValueChange={(v) => setForm({ ...form, instructor_type: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">정규직</SelectItem>
                    <SelectItem value="part_time">파트타임</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary settings */}
            <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">급여 설정</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>급여유형</Label>
                  <Select
                    value={form.salary_type}
                    onValueChange={(v) => setForm({ ...form, salary_type: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_class">건당</SelectItem>
                      <SelectItem value="hourly">시급</SelectItem>
                      <SelectItem value="monthly">월급</SelectItem>
                      <SelectItem value="mixed">혼합</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>세금유형</Label>
                  <Select
                    value={form.tax_type}
                    onValueChange={(v) => setForm({ ...form, tax_type: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3.3%">3.3% 원천징수</SelectItem>
                      <SelectItem value="insurance">4대보험</SelectItem>
                      <SelectItem value="none">비과세</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional rate fields */}
              {(form.salary_type === "monthly" || form.salary_type === "mixed") && (
                <div className="space-y-2">
                  <Label>기본급 (월)</Label>
                  <Input
                    type="number"
                    value={form.base_salary || ""}
                    onChange={(e) => setForm({ ...form, base_salary: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              )}

              {(form.salary_type === "hourly" || form.salary_type === "mixed") && (
                <div className="space-y-2">
                  <Label>시급</Label>
                  <Input
                    type="number"
                    value={form.hourly_rate || ""}
                    onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              )}

              {(form.salary_type === "per_class" || form.salary_type === "mixed") && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">오전 단가</Label>
                    <Input
                      type="number"
                      value={form.morning_class_rate || ""}
                      onChange={(e) =>
                        setForm({ ...form, morning_class_rate: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">오후 단가</Label>
                    <Input
                      type="number"
                      value={form.afternoon_class_rate || ""}
                      onChange={(e) =>
                        setForm({ ...form, afternoon_class_rate: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">저녁 단가</Label>
                    <Input
                      type="number"
                      value={form.evening_class_rate || ""}
                      onChange={(e) =>
                        setForm({ ...form, evening_class_rate: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
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
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
