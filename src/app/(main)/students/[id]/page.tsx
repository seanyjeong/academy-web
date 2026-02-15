"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { studentsAPI } from "@/lib/api/students";
import { attendanceAPI } from "@/lib/api/attendance";
import { Student, STATUS_LABELS, StudentStatus, TIME_SLOT_LABELS } from "@/lib/types/student";

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: "bg-blue-50 text-blue-600",
  trial: "bg-amber-50 text-amber-600",
  paused: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
  graduated: "bg-green-50 text-green-600",
  pending: "bg-slate-50 text-slate-400",
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<{ date: string; status: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    parent_phone: "",
    school: "",
    grade: "",
    time_slot: "" as "morning" | "afternoon" | "evening" | "",
    memo: "",
    status: "active" as StudentStatus,
  });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await studentsAPI.get(id);
        setStudent(data);
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          parent_phone: data.parent_phone ?? "",
          school: data.school ?? "",
          grade: data.grade ?? "",
          time_slot: data.time_slot ?? "",
          memo: data.memo ?? "",
          status: data.status ?? "active",
        });
      } catch {
        toast.error("학생 정보를 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const { data } = await attendanceAPI.byStudent(id);
        setAttendanceRecords(data.items ?? data ?? []);
      } catch {
        // Attendance may not be available
      }
    }
    loadAttendance();
  }, [id]);

  async function handleSave() {
    try {
      const payload = {
        ...form,
        time_slot: (form.time_slot || undefined) as Student["time_slot"],
      };
      const { data } = await studentsAPI.update(id, payload);
      setStudent(data);
      setEditing(false);
      toast.success("학생 정보가 수정되었습니다");
    } catch {
      toast.error("수정에 실패했습니다");
    }
  }

  async function handleDelete() {
    try {
      await studentsAPI.delete(id);
      toast.success("학생이 삭제되었습니다");
      router.push("/students");
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-12 text-center text-slate-400">
        학생 정보를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/students">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              {student.name}
            </h1>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[student.status]}
            >
              {STATUS_LABELS[student.status]}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            등록일: {new Date(student.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="h-4 w-4" />
            {editing ? "취소" : "수정"}
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>학생 삭제</DialogTitle>
                <DialogDescription>
                  {student.name} 학생을 정말 삭제하시겠습니까? 이 작업은 되돌릴
                  수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  취소
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">기본정보</TabsTrigger>
          <TabsTrigger value="training">훈련기록</TabsTrigger>
          <TabsTrigger value="payments">수납내역</TabsTrigger>
          <TabsTrigger value="attendance">출결현황</TabsTrigger>
          <TabsTrigger value="consultations">상담이력</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>이름</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>상태</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          setForm({ ...form, status: v as StudentStatus })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as StudentStatus[]).map(
                            (s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>연락처</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>학부모 연락처</Label>
                      <Input
                        value={form.parent_phone}
                        onChange={(e) =>
                          setForm({ ...form, parent_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>학교</Label>
                      <Input
                        value={form.school}
                        onChange={(e) =>
                          setForm({ ...form, school: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>학년</Label>
                      <Input
                        value={form.grade}
                        onChange={(e) =>
                          setForm({ ...form, grade: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>수업 시간대</Label>
                    <Select
                      value={form.time_slot}
                      onValueChange={(v) =>
                        setForm({ ...form, time_slot: v as "morning" | "afternoon" | "evening" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">오전반</SelectItem>
                        <SelectItem value="afternoon">오후반</SelectItem>
                        <SelectItem value="evening">저녁반</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>메모</Label>
                    <textarea
                      value={form.memo}
                      onChange={(e) =>
                        setForm({ ...form, memo: e.target.value })
                      }
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                    />
                  </div>
                  <Button onClick={handleSave}>저장</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-slate-500">이름</div>
                    <div className="text-slate-900">{student.name}</div>
                    <div className="text-slate-500">상태</div>
                    <div>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[student.status]}
                      >
                        {STATUS_LABELS[student.status]}
                      </Badge>
                    </div>
                    <div className="text-slate-500">연락처</div>
                    <div className="text-slate-900">
                      {student.phone ?? "-"}
                    </div>
                    <div className="text-slate-500">학부모 연락처</div>
                    <div className="text-slate-900">
                      {student.parent_phone ?? "-"}
                    </div>
                    <div className="text-slate-500">학교</div>
                    <div className="text-slate-900">
                      {student.school ?? "-"}
                    </div>
                    <div className="text-slate-500">학년</div>
                    <div className="text-slate-900">
                      {student.grade ?? "-"}
                    </div>
                    <div className="text-slate-500">수업 시간대</div>
                    <div className="text-slate-900">
                      {student.time_slot
                        ? TIME_SLOT_LABELS[student.time_slot] ?? student.time_slot
                        : "-"}
                    </div>
                    <div className="text-slate-500">메모</div>
                    <div className="text-slate-900">
                      {student.memo ?? "-"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>훈련기록</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-slate-400">
                훈련 모듈에서 기록을 확인할 수 있습니다
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>수납내역</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-slate-400">
                수납 내역이 없습니다
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>출결현황</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  출결 기록이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {attendanceRecords.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
                    >
                      <span className="text-slate-700">{r.date}</span>
                      <Badge variant="secondary">
                        {r.status === "present"
                          ? "출석"
                          : r.status === "absent"
                            ? "결석"
                            : r.status === "late"
                              ? "지각"
                              : r.status === "excused"
                                ? "사유결석"
                                : r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultations">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>상담이력</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-slate-400">
                상담 기록이 없습니다
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
