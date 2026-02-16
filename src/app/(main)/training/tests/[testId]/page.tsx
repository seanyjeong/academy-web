"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Users,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { testsAPI } from "@/lib/api/training";
import { studentsAPI } from "@/lib/api/students";
import type {
  MonthlyTest,
  TestSession,
  TestParticipant,
  TestGroup,
} from "@/lib/types/training";
import { TEST_STATUS_MAP } from "@/lib/types/training";
import type { Student } from "@/lib/types/student";

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

interface ParticipantView extends TestParticipant {
  student_name?: string;
}

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = Number(params.testId);

  const [test, setTest] = useState<MonthlyTest | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [participants, setParticipants] = useState<ParticipantView[]>([]);
  const [groups, setGroups] = useState<TestGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("sessions");

  // Edit test
  const [showEditTest, setShowEditTest] = useState(false);
  const [editTestForm, setEditTestForm] = useState({
    name: "",
    status: "" as string,
  });

  // Delete test
  const [showDeleteTest, setShowDeleteTest] = useState(false);

  // Session add
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });

  // Participant add
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Group dialogs
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TestGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "" });
  const [groupStudentIds, setGroupStudentIds] = useState<number[]>([]);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAction, setDeleteAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // --- Fetch ---
  const fetchTest = useCallback(async () => {
    try {
      const { data } = await testsAPI.get(testId);
      setTest(data as MonthlyTest);
    } catch {
      toast.error("테스트 정보를 불러오지 못했습니다");
    }
  }, [testId]);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await testsAPI.listSessions(testId);
      setSessions(Array.isArray(data) ? (data as TestSession[]) : []);
    } catch {
      toast.error("세션 목록을 불러오지 못했습니다");
    }
  }, [testId]);

  const fetchParticipants = useCallback(async () => {
    try {
      const { data } = await testsAPI.listParticipants(testId);
      setParticipants(
        Array.isArray(data) ? (data as ParticipantView[]) : []
      );
    } catch {
      toast.error("참가자 목록을 불러오지 못했습니다");
    }
  }, [testId]);

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await testsAPI.listGroups(testId);
      setGroups(Array.isArray(data) ? (data as TestGroup[]) : []);
    } catch {
      toast.error("그룹 목록을 불러오지 못했습니다");
    }
  }, [testId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchTest(),
      fetchSessions(),
      fetchParticipants(),
      fetchGroups(),
    ]);
    setLoading(false);
  }, [fetchTest, fetchSessions, fetchParticipants, fetchGroups]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Edit Test ---
  const openEditTest = () => {
    if (!test) return;
    setEditTestForm({ name: test.name, status: test.status });
    setShowEditTest(true);
  };

  const handleEditTest = async () => {
    try {
      await testsAPI.update(testId, {
        name: editTestForm.name.trim(),
        status: editTestForm.status,
      });
      setShowEditTest(false);
      toast.success("테스트가 수정되었습니다");
      fetchTest();
    } catch {
      toast.error("수정에 실패했습니다");
    }
  };

  // --- Delete Test ---
  const handleDeleteTest = async () => {
    try {
      await testsAPI.delete(testId);
      toast.success("테스트가 삭제되었습니다");
      router.push("/training/tests");
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  // --- Sessions ---
  const openAddSession = () => {
    setSessionForm({ date: "", start_time: "", end_time: "" });
    setShowAddSession(true);
  };

  const handleAddSession = async () => {
    if (!sessionForm.date) {
      toast.error("날짜를 입력해주세요");
      return;
    }
    try {
      await testsAPI.createSession(testId, {
        date: sessionForm.date,
        start_time: sessionForm.start_time || null,
        end_time: sessionForm.end_time || null,
      });
      setShowAddSession(false);
      toast.success("세션이 추가되었습니다");
      fetchSessions();
    } catch {
      toast.error("세션 추가에 실패했습니다");
    }
  };

  const confirmDeleteSession = (session: TestSession) => {
    setDeleteMessage(`세션 (${session.date})을 삭제하시겠습니까?`);
    setDeleteAction(() => async () => {
      await testsAPI.deleteSession(session.id);
      toast.success("세션이 삭제되었습니다");
      fetchSessions();
    });
    setShowDeleteConfirm(true);
  };

  // --- Participants ---
  const openAddParticipant = async () => {
    setSelectedStudentIds([]);
    setStudentSearch("");
    try {
      const { data } = await studentsAPI.list({
        status: "active",
        limit: 500,
      });
      const list = Array.isArray(data)
        ? data
        : ((data as { items?: Student[] })?.items ?? []);
      setAllStudents(list as Student[]);
    } catch {
      toast.error("학생 목록을 불러오지 못했습니다");
    }
    setShowAddParticipant(true);
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddParticipants = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("학생을 선택해주세요");
      return;
    }
    try {
      await testsAPI.addParticipant(testId, {
        student_ids: selectedStudentIds,
      });
      setShowAddParticipant(false);
      toast.success(`${selectedStudentIds.length}명이 등록되었습니다`);
      fetchParticipants();
    } catch {
      toast.error("등록에 실패했습니다");
    }
  };

  const confirmRemoveParticipant = (p: ParticipantView) => {
    setDeleteMessage(
      `참가자 "${p.student_name ?? p.student_id}"를 제거하시겠습니까?`
    );
    setDeleteAction(() => async () => {
      await testsAPI.removeParticipant(testId, p.id);
      toast.success("참가자가 제거되었습니다");
      fetchParticipants();
    });
    setShowDeleteConfirm(true);
  };

  const existingStudentIds = new Set(participants.map((p) => p.student_id));
  const filteredStudents = allStudents.filter(
    (s) =>
      !existingStudentIds.has(s.id) &&
      s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // --- Groups ---
  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: "" });
    setGroupStudentIds([]);
    setShowGroupDialog(true);
  };

  const openEditGroup = (group: TestGroup) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name });
    const ids =
      typeof group.student_ids === "string"
        ? JSON.parse(group.student_ids || "[]")
        : (group.student_ids ?? []);
    setGroupStudentIds(ids);
    setShowGroupDialog(true);
  };

  const toggleGroupStudent = (id: number) => {
    setGroupStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error("그룹명을 입력해주세요");
      return;
    }
    try {
      const payload = {
        name: groupForm.name.trim(),
        student_ids: groupStudentIds,
      };
      if (editingGroup) {
        await testsAPI.updateGroup(testId, editingGroup.id, payload);
        toast.success("그룹이 수정되었습니다");
      } else {
        await testsAPI.createGroup(testId, payload);
        toast.success("그룹이 생성되었습니다");
      }
      setShowGroupDialog(false);
      fetchGroups();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const confirmDeleteGroup = (group: TestGroup) => {
    setDeleteMessage(`그룹 "${group.name}"을 삭제하시겠습니까?`);
    setDeleteAction(() => async () => {
      await testsAPI.deleteGroup(testId, group.id);
      toast.success("그룹이 삭제되었습니다");
      fetchGroups();
    });
    setShowDeleteConfirm(true);
  };

  // --- Generic Delete ---
  const handleConfirmDelete = async () => {
    if (deleteAction) {
      try {
        await deleteAction();
      } catch {
        toast.error("삭제에 실패했습니다");
      }
    }
    setShowDeleteConfirm(false);
    setDeleteAction(null);
  };

  const getGroupStudentCount = (group: TestGroup) => {
    const ids =
      typeof group.student_ids === "string"
        ? JSON.parse(group.student_ids || "[]")
        : (group.student_ids ?? []);
    return ids.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        테스트를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <div className="mb-6">
        <Link
          href="/training/tests"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{test.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {test.year_month}
              </span>
              <Badge variant={STATUS_VARIANT[test.status] ?? "outline"}>
                {TEST_STATUS_MAP[test.status] ?? test.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEditTest}>
              <Pencil className="h-4 w-4" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => setShowDeleteTest(true)}
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
            <Link href={`/training/tests/${testId}/rankings`}>
              <Button variant="outline" size="sm">
                <Trophy className="h-4 w-4" />
                순위 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sessions">
            <Clock className="mr-1 h-3.5 w-3.5" />
            세션 관리
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="mr-1 h-3.5 w-3.5" />
            참가자
            {participants.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {participants.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="groups">
            그룹
            {groups.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {groups.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Sessions */}
        <TabsContent value="sessions">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              세션 목록
            </h2>
            <Button size="sm" onClick={openAddSession}>
              <Plus className="h-4 w-4" />
              세션 추가
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 세션이 없습니다
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="group relative transition-shadow hover:shadow-md"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-7 w-7 p-0 text-red-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                    onClick={() => confirmDeleteSession(session)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Link
                    href={`/training/tests/${testId}/${session.id}`}
                    className="block"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        {session.date}
                      </CardTitle>
                      <CardDescription>
                        {session.start_time && session.end_time
                          ? `${session.start_time} ~ ${session.end_time}`
                          : session.start_time
                            ? `${session.start_time} ~`
                            : "시간 미정"}
                      </CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Participants */}
        <TabsContent value="participants">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              참가자 목록
            </h2>
            <Button size="sm" onClick={openAddParticipant}>
              <Plus className="h-4 w-4" />
              참가자 등록
            </Button>
          </div>

          {participants.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 참가자가 없습니다
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p, idx) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-slate-400">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.student_name ?? `학생 #${p.student_id}`}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-red-400 hover:text-red-600"
                            onClick={() => confirmRemoveParticipant(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Groups */}
        <TabsContent value="groups">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              그룹 목록
            </h2>
            <Button size="sm" onClick={openCreateGroup}>
              <Plus className="h-4 w-4" />
              그룹 생성
            </Button>
          </div>

          {groups.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 그룹이 없습니다
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-green-500" />
                      {group.name}
                    </CardTitle>
                    <CardDescription>
                      {getGroupStudentCount(group)}명
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditGroup(group)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => confirmDeleteGroup(group)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* --- Dialogs --- */}

      {/* Edit Test */}
      <Dialog open={showEditTest} onOpenChange={setShowEditTest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>테스트명</Label>
              <Input
                value={editTestForm.name}
                onChange={(e) =>
                  setEditTestForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>상태</Label>
              <Select
                value={editTestForm.status}
                onValueChange={(v) =>
                  setEditTestForm((f) => ({ ...f, status: v }))
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
            <Button variant="outline" onClick={() => setShowEditTest(false)}>
              취소
            </Button>
            <Button onClick={handleEditTest}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Test */}
      <Dialog open={showDeleteTest} onOpenChange={setShowDeleteTest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 삭제</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-slate-600">
            &quot;{test.name}&quot; 테스트와 관련된 모든 데이터가 삭제됩니다. 이
            작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTest(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteTest}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Session */}
      <Dialog open={showAddSession} onOpenChange={setShowAddSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세션 추가</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>날짜</Label>
              <Input
                type="date"
                value={sessionForm.date}
                onChange={(e) =>
                  setSessionForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>시작 시간</Label>
                <Input
                  type="time"
                  value={sessionForm.start_time}
                  onChange={(e) =>
                    setSessionForm((f) => ({
                      ...f,
                      start_time: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>종료 시간</Label>
                <Input
                  type="time"
                  value={sessionForm.end_time}
                  onChange={(e) =>
                    setSessionForm((f) => ({
                      ...f,
                      end_time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSession(false)}>
              취소
            </Button>
            <Button onClick={handleAddSession}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participants */}
      <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
        <DialogContent className="max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>참가자 등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="학생 검색..."
                className="pl-9"
              />
            </div>
            {selectedStudentIds.length > 0 && (
              <p className="text-sm text-blue-600">
                {selectedStudentIds.length}명 선택됨
              </p>
            )}
            <div className="max-h-[40vh] overflow-y-auto rounded border">
              {filteredStudents.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  추가할 수 있는 학생이 없습니다
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selectedStudentIds.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <span className="text-sm">{student.name}</span>
                    {student.grade && (
                      <Badge variant="outline" className="text-xs">
                        {student.grade}
                      </Badge>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddParticipant(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleAddParticipants}
              disabled={selectedStudentIds.length === 0}
            >
              {selectedStudentIds.length}명 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "그룹 수정" : "그룹 생성"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>그룹명</Label>
              <Input
                value={groupForm.name}
                onChange={(e) =>
                  setGroupForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="A조"
              />
            </div>
            <div>
              <Label className="mb-2 block">
                참가자 선택 ({groupStudentIds.length}명)
              </Label>
              <div className="max-h-[35vh] overflow-y-auto rounded border">
                {participants.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-400">
                    참가자를 먼저 등록해주세요
                  </div>
                ) : (
                  participants.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={groupStudentIds.includes(p.student_id)}
                        onCheckedChange={() =>
                          toggleGroupStudent(p.student_id)
                        }
                      />
                      <span className="text-sm">
                        {p.student_name ?? `학생 #${p.student_id}`}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGroupDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleSaveGroup}>
              {editingGroup ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-slate-600">{deleteMessage}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
