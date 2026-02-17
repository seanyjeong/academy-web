"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Pencil,
  Trash2,
  UsersRound,
  Users,
  UserCheck,
  BarChart3,
} from "lucide-react";
import { format, parseISO, addDays, subDays } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { assignmentsAPI } from "@/lib/api/training";
import { studentsAPI } from "@/lib/api/students";
import type { DailyAssignment, ClassInstructor } from "@/lib/types/training";
import { TIME_SLOT_MAP } from "@/lib/types/training";

type TimeSlot = "morning" | "afternoon" | "evening";

interface StudentInfo {
  id: number;
  name: string;
}

const CLASS_OPTIONS = [
  { value: "1", label: "1반" },
  { value: "2", label: "2반" },
  { value: "3", label: "3반" },
  { value: "4", label: "4반" },
  { value: "5", label: "5반" },
];

const ROLE_OPTIONS = [
  { value: "main", label: "메인" },
  { value: "sub", label: "서브" },
];

export default function AssignmentsPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tab, setTab] = useState<TimeSlot>("morning");
  const [assignments, setAssignments] = useState<DailyAssignment[]>([]);
  const [instructors, setInstructors] = useState<ClassInstructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Edit assignment
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DailyAssignment | null>(null);
  const [editForm, setEditForm] = useState({
    time_slot: "" as string,
    class_id: "" as string,
  });

  // Student name map
  const [studentNames, setStudentNames] = useState<Record<number, string>>({});

  // Bulk assignment
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkTimeSlot, setBulkTimeSlot] = useState<TimeSlot>("morning");
  const [bulkClassId, setBulkClassId] = useState("1");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [activeStudents, setActiveStudents] = useState<StudentInfo[]>([]);

  // Instructor assignment
  const [showInstructorDialog, setShowInstructorDialog] = useState(false);
  const [instructorForm, setInstructorForm] = useState({
    class_id: "1",
    instructor_id: "",
    role: "main",
  });

  const prevDate = () =>
    setDate((d) => format(subDays(parseISO(d), 1), "yyyy-MM-dd"));
  const nextDate = () =>
    setDate((d) => format(addDays(parseISO(d), 1), "yyyy-MM-dd"));
  const goToday = () => setDate(format(new Date(), "yyyy-MM-dd"));

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await assignmentsAPI.list({
        date,
        time_slot: tab,
      });
      setAssignments(data as DailyAssignment[]);
    } catch {
      toast.error("배정을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [date, tab]);

  const fetchInstructors = useCallback(async () => {
    try {
      const { data } = await assignmentsAPI.listInstructors({
        date,
        time_slot: tab,
      });
      setInstructors(data as ClassInstructor[]);
    } catch {
      // silent
    }
  }, [date, tab]);

  // Fetch student name map (once on mount)
  const fetchStudentNames = useCallback(async () => {
    try {
      const { data } = await studentsAPI.list({ limit: 500 });
      const list = data?.items ?? (Array.isArray(data) ? data : []);
      const map: Record<number, string> = {};
      for (const s of list) {
        map[s.id] = s.name;
      }
      setStudentNames(map);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchInstructors();
    fetchStudentNames();
  }, [fetchAssignments, fetchInstructors, fetchStudentNames]);

  // Stats
  const stats = useMemo(() => {
    const total = assignments.length;
    const byClass: Record<string, number> = {};
    assignments.forEach((a) => {
      const key = a.class_id ? `${a.class_id}반` : "미배정";
      byClass[key] = (byClass[key] ?? 0) + 1;
    });
    return { total, byClass };
  }, [assignments]);

  // Update class for single assignment
  const handleUpdateClass = async (assignmentId: number, classId: string) => {
    try {
      await assignmentsAPI.update(assignmentId, {
        class_id: classId === "none" ? null : Number(classId),
      });
      toast.success("반이 배정되었습니다");
      fetchAssignments();
    } catch {
      toast.error("배정에 실패했습니다");
    }
  };

  // Delete assignment
  const handleDelete = async (id: number) => {
    if (!confirm("이 배정을 삭제하시겠습니까?")) return;
    try {
      await assignmentsAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchAssignments();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  // Edit assignment
  const openEditDialog = (assignment: DailyAssignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      time_slot: assignment.time_slot,
      class_id: assignment.class_id ? String(assignment.class_id) : "none",
    });
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editingAssignment) return;
    try {
      await assignmentsAPI.update(editingAssignment.id, {
        time_slot: editForm.time_slot,
        class_id: editForm.class_id === "none" ? null : Number(editForm.class_id),
      });
      toast.success("배정이 수정되었습니다");
      setShowEditDialog(false);
      fetchAssignments();
    } catch {
      toast.error("수정에 실패했습니다");
    }
  };

  // Sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      await assignmentsAPI.sync({ date, time_slot: tab });
      toast.success("학생이 동기화되었습니다");
      fetchAssignments();
    } catch {
      toast.error("동기화에 실패했습니다");
    } finally {
      setSyncing(false);
    }
  };

  // Bulk assignment
  const openBulkDialog = async () => {
    setBulkTimeSlot(tab);
    setBulkClassId("1");
    setSelectedStudentIds([]);
    try {
      const { data } = await assignmentsAPI.syncStudents({});
      setActiveStudents(data as StudentInfo[]);
    } catch {
      toast.error("학생 목록을 불러오지 못했습니다");
    }
    setShowBulkDialog(true);
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === activeStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(activeStudents.map((s) => s.id));
    }
  };

  const handleBulkCreate = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("학생을 선택하세요");
      return;
    }
    try {
      await assignmentsAPI.bulkCreate({
        date,
        time_slot: bulkTimeSlot,
        assignments: selectedStudentIds.map((student_id) => ({
          student_id,
          class_id: Number(bulkClassId),
        })),
      });
      toast.success(`${selectedStudentIds.length}명 일괄 배정 완료`);
      setShowBulkDialog(false);
      fetchAssignments();
    } catch {
      toast.error("일괄 배정에 실패했습니다");
    }
  };

  // Instructor assignment
  const openInstructorDialog = () => {
    setInstructorForm({ class_id: "1", instructor_id: "", role: "main" });
    setShowInstructorDialog(true);
  };

  const handleAssignInstructor = async () => {
    if (!instructorForm.instructor_id) {
      toast.error("강사를 입력하세요");
      return;
    }
    try {
      await assignmentsAPI.assignInstructor({
        date,
        time_slot: tab,
        class_id: Number(instructorForm.class_id),
        instructor_id: Number(instructorForm.instructor_id),
        role: instructorForm.role,
      });
      toast.success("강사가 배정되었습니다");
      setShowInstructorDialog(false);
      fetchInstructors();
    } catch {
      toast.error("강사 배정에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">배정 관리</h1>
          <p className="text-sm text-slate-500">
            학생의 시간대와 반을 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openBulkDialog}>
            <Users className="mr-1 h-4 w-4" />
            일괄 배정
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw
              className={`mr-1 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            학생 동기화
          </Button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="mb-4 flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={prevDate}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[120px] text-center font-semibold">{date}</span>
        <Button size="sm" variant="outline" onClick={nextDate}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={goToday}>
          오늘
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-slate-500">총 인원</p>
              <p className="text-lg font-bold">{stats.total}명</p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(stats.byClass).map(([cls, count]) => (
          <Card key={cls}>
            <CardContent className="flex items-center gap-3 p-4">
              <UsersRound className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-500">{cls}</p>
                <p className="text-lg font-bold">{count}명</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time slot tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-indigo-500" />
              학생 배정
            </span>
            <Button size="sm" variant="outline" onClick={openInstructorDialog}>
              <UserCheck className="mr-1 h-3.5 w-3.5" />
              강사 배정
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TimeSlot)}
          >
            <TabsList>
              {(Object.entries(TIME_SLOT_MAP) as [TimeSlot, string][]).map(
                ([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            {(Object.keys(TIME_SLOT_MAP) as TimeSlot[]).map((slot) => (
              <TabsContent key={slot} value={slot}>
                {/* Instructor badges */}
                {instructors.filter((i) => i.time_slot === slot).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {instructors
                      .filter((i) => i.time_slot === slot)
                      .map((inst) => (
                        <Badge
                          key={inst.id}
                          variant={inst.role === "main" ? "default" : "secondary"}
                        >
                          {inst.class_id}반 -{" "}
                          {inst.role === "main" ? "메인" : "서브"} ({studentNames[inst.instructor_id] ?? `#${inst.instructor_id}`})
                        </Badge>
                      ))}
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    배정된 학생이 없습니다
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>학생</TableHead>
                        <TableHead>반 배정</TableHead>
                        <TableHead className="w-[120px]">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment, idx) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="text-slate-400">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {studentNames[assignment.student_id] ?? `학생 #${assignment.student_id}`}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={
                                assignment.class_id
                                  ? String(assignment.class_id)
                                  : "none"
                              }
                              onValueChange={(v) =>
                                handleUpdateClass(assignment.id, v)
                              }
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="미배정" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">미배정</SelectItem>
                                {CLASS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(assignment)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(assignment.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Assignment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배정 수정</DialogTitle>
            <DialogDescription>
              학생의 시간대와 반을 수정합니다
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>시간대</Label>
              <Select
                value={editForm.time_slot}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, time_slot: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TIME_SLOT_MAP) as [TimeSlot, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>반</Label>
              <Select
                value={editForm.class_id}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, class_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미배정</SelectItem>
                  {CLASS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditSave}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>일괄 배정</DialogTitle>
            <DialogDescription>
              학생을 선택하고 시간대, 반을 일괄 배정합니다
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>시간대</Label>
                <Select
                  value={bulkTimeSlot}
                  onValueChange={(v) => setBulkTimeSlot(v as TimeSlot)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(TIME_SLOT_MAP) as [TimeSlot, string][]
                    ).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>반</Label>
                <Select value={bulkClassId} onValueChange={setBulkClassId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>학생 선택</Label>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={toggleAllStudents}
                >
                  {selectedStudentIds.length === activeStudents.length
                    ? "전체 해제"
                    : "전체 선택"}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                {activeStudents.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    활성 학생이 없습니다
                  </p>
                ) : (
                  activeStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() =>
                          toggleStudentSelection(student.id)
                        }
                      />
                      <span className="text-sm">{student.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-400">
                {selectedStudentIds.length}명 선택됨
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={selectedStudentIds.length === 0}
            >
              일괄 배정 ({selectedStudentIds.length}명)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructor Assignment Dialog */}
      <Dialog
        open={showInstructorDialog}
        onOpenChange={setShowInstructorDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>강사 배정</DialogTitle>
            <DialogDescription>
              반별 강사를 배정합니다 ({date} {TIME_SLOT_MAP[tab]})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>반</Label>
              <Select
                value={instructorForm.class_id}
                onValueChange={(v) =>
                  setInstructorForm((f) => ({ ...f, class_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>강사 ID</Label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={instructorForm.instructor_id}
                onChange={(e) =>
                  setInstructorForm((f) => ({
                    ...f,
                    instructor_id: e.target.value,
                  }))
                }
                placeholder="강사 ID 입력"
              />
            </div>
            <div className="grid gap-2">
              <Label>역할</Label>
              <Select
                value={instructorForm.role}
                onValueChange={(v) =>
                  setInstructorForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInstructorDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleAssignInstructor}>배정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
