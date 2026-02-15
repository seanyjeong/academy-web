"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { staffAPI } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Shield, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "원장",
  admin: "관리자",
  staff: "직원",
  teacher: "강사",
};

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  owner: "default",
  admin: "secondary",
  staff: "outline",
  teacher: "outline",
};

const PERMISSION_PAGES = [
  "students", "attendance", "schedules", "seasons", "instructors",
  "payments", "salaries", "incomes", "expenses", "consultations",
  "training", "reports", "staff", "notifications",
];

const PAGE_LABELS: Record<string, string> = {
  students: "학생관리",
  attendance: "출결",
  schedules: "수업",
  seasons: "시즌",
  instructors: "강사",
  payments: "수납",
  salaries: "급여",
  incomes: "수입",
  expenses: "지출",
  consultations: "상담",
  training: "훈련",
  reports: "리포트",
  staff: "직원",
  notifications: "SMS",
};

const ACTIONS = ["view", "create", "edit", "delete"];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    phone: "",
  });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await staffAPI.list();
      setStaffList(Array.isArray(data) ? data : data.data || []);
    } catch {
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreate = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      toast.error("이름, 이메일, 비밀번호는 필수입니다");
      return;
    }
    try {
      await staffAPI.create(newStaff);
      toast.success("직원이 등록되었습니다");
      setCreateOpen(false);
      setNewStaff({ name: "", email: "", password: "", role: "staff", phone: "" });
      fetchStaff();
    } catch {
      toast.error("등록에 실패했습니다");
    }
  };

  const openPermissions = (staff: any) => {
    setSelectedStaff(staff);
    const p: Record<string, Record<string, boolean>> = {};
    PERMISSION_PAGES.forEach((page) => {
      p[page] = {};
      ACTIONS.forEach((action) => {
        p[page][action] = staff.permissions?.[page]?.[action] ?? false;
      });
    });
    setPermissions(p);
    setPermOpen(true);
  };

  const togglePerm = (page: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page][action],
      },
    }));
  };

  const savePermissions = async () => {
    if (!selectedStaff) return;
    try {
      await staffAPI.updatePermissions(selectedStaff.id, permissions);
      toast.success("권한이 저장되었습니다");
      setPermOpen(false);
      fetchStaff();
    } catch {
      toast.error("권한 저장에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">직원관리</h1>
          <p className="text-sm text-slate-500">직원 정보와 권한을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Link href="/staff/users">
            <Button variant="outline" size="sm">
              <Users className="mr-1.5 h-4 w-4" />
              사용자 관리
            </Button>
          </Link>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                직원 등록
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>직원 등록</DialogTitle>
                <DialogDescription>새 직원을 등록합니다</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>이름 *</Label>
                  <Input
                    value={newStaff.name}
                    onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>이메일 *</Label>
                  <Input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>비밀번호 *</Label>
                  <Input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>역할</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(v) => setNewStaff((p) => ({ ...p, role: v }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="staff">직원</SelectItem>
                      <SelectItem value="teacher">강사</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>연락처</Label>
                  <Input
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreate}>등록</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead className="w-[100px]">권한</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  등록된 직원이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[s.role] || "secondary"}>
                      {ROLE_LABELS[s.role] || s.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone || "-"}</TableCell>
                  <TableCell>
                    {s.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPermissions(s)}
                      >
                        <Shield className="mr-1 h-4 w-4" />
                        권한
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Permission matrix dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>권한 설정 - {selectedStaff?.name}</DialogTitle>
            <DialogDescription>
              페이지별 접근 권한을 설정합니다
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>페이지</TableHead>
                  <TableHead className="text-center">조회</TableHead>
                  <TableHead className="text-center">생성</TableHead>
                  <TableHead className="text-center">수정</TableHead>
                  <TableHead className="text-center">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_PAGES.map((page) => (
                  <TableRow key={page}>
                    <TableCell className="font-medium">{PAGE_LABELS[page]}</TableCell>
                    {ACTIONS.map((action) => (
                      <TableCell key={action} className="text-center">
                        <button
                          onClick={() => togglePerm(page, action)}
                          className={`relative h-5 w-9 rounded-full transition-colors ${
                            permissions[page]?.[action]
                              ? "bg-blue-600"
                              : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                              permissions[page]?.[action]
                                ? "left-[18px]"
                                : "left-0.5"
                            }`}
                          />
                        </button>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPermOpen(false)}>
              취소
            </Button>
            <Button onClick={savePermissions}>저장</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
