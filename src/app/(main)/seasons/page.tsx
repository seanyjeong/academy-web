"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Calendar,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Eye,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { seasonsAPI } from "@/lib/api/seasons";
import { studentsAPI } from "@/lib/api/students";
import { formatKRW, formatDate } from "@/lib/format";

interface Season {
  id: number;
  name: string;
  season_type: string;
  start_date: string;
  end_date: string;
  enrollment_start?: string;
  enrollment_end?: string;
  fee: number;
  operating_days?: number[];
  description?: string;
  student_count?: number;
  status?: string;
  created_at: string;
}

interface StudentItem {
  id: number;
  name: string;
  phone?: string;
  status: string;
  school?: string;
}

const SEASON_TYPE_LABELS: Record<string, string> = {
  exam_early: "수시",
  exam_regular: "정시",
  civil_service: "공무원",
  general: "일반",
};

const SEASON_TYPE_COLORS: Record<string, string> = {
  exam_early: "bg-purple-50 text-purple-600",
  exam_regular: "bg-blue-50 text-blue-600",
  civil_service: "bg-green-50 text-green-600",
  general: "bg-slate-100 text-slate-500",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-600",
  active: "bg-green-50 text-green-600",
  completed: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "예정",
  active: "진행중",
  completed: "종료",
};

function getSeasonStatus(s: Season): string {
  if (s.status) return s.status;
  const now = new Date();
  const start = new Date(s.start_date);
  const end = new Date(s.end_date);
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "active";
}

const INITIAL_FORM = {
  name: "",
  season_type: "general",
  start_date: "",
  end_date: "",
  fee: "",
  description: "",
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Season | null>(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  // Detail / Enrollment panel state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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
      await seasonsAPI.create({
        ...form,
        fee: Number(form.fee) || 0,
      });
      toast.success("시즌이 등록되었습니다");
      setCreateOpen(false);
      setForm({ ...INITIAL_FORM });
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
      if (expandedId === deleteTarget.id) setExpandedId(null);
      fetchSeasons();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  const loadSeasonDetail = useCallback(async (seasonId: number) => {
    setDetailLoading(true);
    try {
      const [enrolledRes, studentsRes] = await Promise.allSettled([
        seasonsAPI.students(seasonId),
        studentsAPI.list({ status: "active", limit: 200 }),
      ]);
      if (enrolledRes.status === "fulfilled") {
        const d = enrolledRes.value.data;
        setEnrolledStudents(d.items ?? d ?? []);
      }
      if (studentsRes.status === "fulfilled") {
        const d = studentsRes.value.data;
        setAllStudents(d.items ?? d ?? []);
      }
    } catch {
      // graceful
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function toggleExpand(seasonId: number) {
    if (expandedId === seasonId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(seasonId);
    setSelectedStudentIds([]);
    setStudentSearch("");
    loadSeasonDetail(seasonId);
  }

  async function handleEnroll(seasonId: number) {
    if (selectedStudentIds.length === 0) return;
    setEnrollLoading(true);
    try {
      await seasonsAPI.enroll(seasonId, { student_ids: selectedStudentIds });
      toast.success(`${selectedStudentIds.length}명이 등록되었습니다`);
      setSelectedStudentIds([]);
      loadSeasonDetail(seasonId);
      fetchSeasons();
    } catch {
      toast.error("수강생 등록에 실패했습니다");
    } finally {
      setEnrollLoading(false);
    }
  }

  async function handleRemoveStudent(seasonId: number, studentId: number) {
    try {
      await seasonsAPI.removeStudent(seasonId, studentId);
      toast.success("수강생이 제거되었습니다");
      loadSeasonDetail(seasonId);
      fetchSeasons();
    } catch {
      toast.error("수강생 제거에 실패했습니다");
    }
  }

  const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
  const filteredStudents = allStudents.filter((s) => {
    if (enrolledIds.has(s.id)) return false;
    if (!studentSearch) return true;
    return (
      s.name.includes(studentSearch) ||
      s.phone?.includes(studentSearch) ||
      s.school?.includes(studentSearch)
    );
  });

  function toggleStudentSelection(id: number) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">시즌 관리</h1>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>시즌 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>시즌 이름</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 2026 봄학기"
                />
              </div>
              <div className="space-y-2">
                <Label>유형</Label>
                <Select
                  value={form.season_type}
                  onValueChange={(v) => setForm({ ...form, season_type: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEASON_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label>수강료</Label>
                <Input
                  type="number"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="시즌에 대한 설명 (선택)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!form.name || !form.start_date || !form.end_date}
              >
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Season list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : seasons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            등록된 시즌이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {seasons.map((s) => {
            const status = getSeasonStatus(s);
            const isExpanded = expandedId === s.id;

            return (
              <div key={s.id} className="space-y-0">
                <Card className="py-4 transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {s.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={
                            SEASON_TYPE_COLORS[s.season_type] ??
                            "bg-slate-100 text-slate-500"
                          }
                        >
                          {SEASON_TYPE_LABELS[s.season_type] ?? s.season_type}
                        </Badge>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          STATUS_COLORS[status] ?? "bg-slate-100 text-slate-500"
                        }
                      >
                        {STATUS_LABELS[status] ?? status}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(s.start_date)} ~ {formatDate(s.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{s.student_count ?? 0}명 등록</span>
                        </div>
                        <span className="font-medium text-slate-700">
                          {formatKRW(s.fee)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpand(s.id)}
                        >
                          <Eye className="h-4 w-4" />
                          상세
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!isExpanded) toggleExpand(s.id);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          수강생 등록
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <Card className="rounded-t-none border-t-0">
                    <CardContent className="space-y-4 pt-4">
                      {detailLoading ? (
                        <div className="flex h-24 items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        </div>
                      ) : (
                        <>
                          {/* Season info */}
                          {s.description && (
                            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                              {s.description}
                            </div>
                          )}

                          {/* Enrolled students */}
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-700">
                              등록된 수강생 ({enrolledStudents.length}명)
                            </h4>
                            {enrolledStudents.length === 0 ? (
                              <p className="text-sm text-slate-400">
                                등록된 수강생이 없습니다
                              </p>
                            ) : (
                              <div className="max-h-48 space-y-1 overflow-y-auto">
                                {enrolledStudents.map((st) => (
                                  <div
                                    key={st.id}
                                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                                  >
                                    <div>
                                      <span className="font-medium text-slate-800">
                                        {st.name}
                                      </span>
                                      {st.phone && (
                                        <span className="ml-2 text-slate-400">
                                          {st.phone}
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-red-500 hover:text-red-600"
                                      onClick={() =>
                                        handleRemoveStudent(s.id, st.id)
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                      제거
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Student search and enroll */}
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-700">
                              수강생 추가
                            </h4>
                            <div className="relative mb-2">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                placeholder="학생 이름, 연락처 검색..."
                                value={studentSearch}
                                onChange={(e) =>
                                  setStudentSearch(e.target.value)
                                }
                                className="pl-9"
                              />
                            </div>
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
                              {filteredStudents.length === 0 ? (
                                <p className="py-4 text-center text-sm text-slate-400">
                                  {studentSearch
                                    ? "검색 결과가 없습니다"
                                    : "추가할 수 있는 학생이 없습니다"}
                                </p>
                              ) : (
                                filteredStudents.map((st) => (
                                  <label
                                    key={st.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-50"
                                  >
                                    <Checkbox
                                      checked={selectedStudentIds.includes(
                                        st.id
                                      )}
                                      onCheckedChange={() =>
                                        toggleStudentSelection(st.id)
                                      }
                                    />
                                    <span className="font-medium text-slate-800">
                                      {st.name}
                                    </span>
                                    {st.phone && (
                                      <span className="text-slate-400">
                                        {st.phone}
                                      </span>
                                    )}
                                    {st.school && (
                                      <span className="text-slate-400">
                                        {st.school}
                                      </span>
                                    )}
                                  </label>
                                ))
                              )}
                            </div>
                            {selectedStudentIds.length > 0 && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-sm text-slate-500">
                                  {selectedStudentIds.length}명 선택
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleEnroll(s.id)}
                                  disabled={enrollLoading}
                                >
                                  {enrollLoading ? "등록 중..." : "등록"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시즌 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; 시즌을 삭제하시겠습니까? 등록된
              수강생 정보도 함께 삭제됩니다.
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
