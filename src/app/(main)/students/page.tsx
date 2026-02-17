"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ArrowUpCircle, CalendarCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { studentsAPI } from "@/lib/api/students";
import {
  Student,
  STATUS_LABELS,
  StudentStatus,
  TIME_SLOT_LABELS,
  STUDENT_TYPE_LABELS,
  DAY_LABELS,
} from "@/lib/types/student";
import { formatKRW } from "@/lib/format";

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: "bg-blue-50 text-blue-600",
  trial: "bg-amber-50 text-amber-600",
  paused: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
  graduated: "bg-green-50 text-green-600",
  pending: "bg-slate-50 text-slate-400",
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "재원" },
  { value: "trial", label: "체험" },
  { value: "paused", label: "휴원" },
  { value: "withdrawn", label: "퇴원" },
  { value: "graduated", label: "졸업" },
  { value: "pending", label: "미등록" },
];

function formatClassDays(classDays: number[] | string | undefined): string {
  if (!classDays) return "-";
  let days: number[];
  if (typeof classDays === "string") {
    try {
      days = JSON.parse(classDays);
    } catch {
      return "-";
    }
  } else {
    days = classDays;
  }
  if (days.length === 0) return "-";
  return days.map((d: number) => DAY_LABELS[d]).join("");
}

interface StatusCounts {
  active: number;
  trial: number;
  paused: number;
  total: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Stat counts
  const [counts, setCounts] = useState<StatusCounts>({
    active: 0,
    trial: 0,
    paused: 0,
    total: 0,
  });

  // Promotion
  interface PromotionEntry {
    student_id: number;
    from_grade: string;
    to_grade: string;
  }
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [promotions, setPromotions] = useState<PromotionEntry[]>([]);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteExecuting, setPromoteExecuting] = useState(false);

  // Bulk class-day change (M3)
  const [showBulkDayDialog, setShowBulkDayDialog] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [bulkDays, setBulkDays] = useState<number[]>([]);
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState("");
  const [bulkDaySubmitting, setBulkDaySubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
      } = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await studentsAPI.list(params);
      setStudents(data.items ?? data ?? []);
      setTotal(data.total ?? (data.items ?? data).length);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  // Fetch stat counts once on mount
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, activeRes, trialRes, pausedRes] = await Promise.all([
        studentsAPI.list({ limit: 0 }),
        studentsAPI.list({ status: "active", limit: 0 }),
        studentsAPI.list({ status: "trial", limit: 0 }),
        studentsAPI.list({ status: "paused", limit: 0 }),
      ]);
      setCounts({
        total: allRes.data.total ?? 0,
        active: activeRes.data.total ?? 0,
        trial: trialRes.data.total ?? 0,
        paused: pausedRes.data.total ?? 0,
      });
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  // Refresh counts when data changes (after creating/deleting students)
  useEffect(() => {
    if (!loading) {
      fetchCounts();
    }
  }, [loading, fetchCounts]);

  // Promotion: preview
  const handlePromotePreview = async () => {
    setPromoteLoading(true);
    setShowPromoteDialog(true);
    try {
      const { data } = await studentsAPI.autoPromote({ dry_run: true });
      setPromotions(data.promotions ?? []);
    } catch {
      toast.error("진급 미리보기에 실패했습니다");
      setPromotions([]);
    } finally {
      setPromoteLoading(false);
    }
  };

  // Promotion: execute
  const handlePromoteExecute = async () => {
    setPromoteExecuting(true);
    try {
      const { data } = await studentsAPI.autoPromote({ dry_run: false });
      toast.success(`${data.promoted_count}명의 학생이 진급되었습니다`);
      setShowPromoteDialog(false);
      fetchStudents();
    } catch {
      toast.error("진급 처리에 실패했습니다");
    } finally {
      setPromoteExecuting(false);
    }
  };

  // Bulk class-day change handler
  const handleBulkDayChange = async () => {
    if (selectedStudentIds.size === 0 || bulkDays.length === 0) return;
    setBulkDaySubmitting(true);
    try {
      let successCount = 0;
      for (const sid of selectedStudentIds) {
        try {
          if (bulkEffectiveDate) {
            // Schedule future change
            await studentsAPI.update(sid, {
              class_days_next: bulkDays,
              class_days_effective_from: bulkEffectiveDate,
            } as Partial<Student>);
          } else {
            // Immediate change
            await studentsAPI.update(sid, { class_days: bulkDays } as Partial<Student>);
          }
          successCount++;
        } catch {
          // continue with others
        }
      }
      toast.success(`${successCount}명의 수업요일이 변경되었습니다`);
      setShowBulkDayDialog(false);
      setSelectedStudentIds(new Set());
      setBulkDays([]);
      setBulkEffectiveDate("");
      fetchStudents();
    } catch {
      toast.error("일괄 변경에 실패했습니다");
    } finally {
      setBulkDaySubmitting(false);
    }
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statCards = [
    {
      label: "재원",
      count: counts.active,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "체험",
      count: counts.trial,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "휴원",
      count: counts.paused,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "전체",
      count: counts.total,
      color: "text-slate-700",
      bgColor: "bg-slate-50",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">학생관리</h1>
          <p className="text-sm text-slate-500">
            전체 {total}명의 학생을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedStudentIds.size === 0) {
                toast.error("먼저 학생을 선택해주세요");
                return;
              }
              setShowBulkDayDialog(true);
            }}
          >
            <CalendarCog className="mr-1 h-4 w-4" />
            요일 일괄변경
            {selectedStudentIds.size > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedStudentIds.size}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={handlePromotePreview}>
            <ArrowUpCircle className="mr-1 h-4 w-4" />
            진급
          </Button>
          <Button asChild>
            <Link href="/students/new">
              <Plus className="h-4 w-4" />
              학생 등록
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className={card.bgColor}>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <span className={`text-2xl font-bold ${card.color}`}>
                {card.count}
              </span>
              <span className="text-sm text-slate-500">{card.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4">
          {/* Status tabs + Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <TabsList>
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="이름, 연락처 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={students.length > 0 && selectedStudentIds.size === students.length}
                      onCheckedChange={toggleAllStudents}
                    />
                  </TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>구분</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>수업요일</TableHead>
                  <TableHead>시간대</TableHead>
                  <TableHead className="text-right">수업료</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-12 text-center text-slate-400"
                    >
                      {search
                        ? "검색 결과가 없습니다"
                        : "등록된 학생이 없습니다"}
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudentIds.has(s.id)}
                          onCheckedChange={() => toggleStudentSelection(s.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/students/${s.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[s.status]}
                        >
                          {STATUS_LABELS[s.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {STUDENT_TYPE_LABELS[s.student_type] ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {s.grade ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {s.phone ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatClassDays(s.class_days)}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {s.time_slot
                          ? (TIME_SLOT_LABELS[s.time_slot] ?? s.time_slot)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-slate-500">
                        {formatKRW(s.final_monthly_tuition)}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(s.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Class-Day Change Dialog (M3) */}
      <Dialog open={showBulkDayDialog} onOpenChange={setShowBulkDayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>요일반 일괄 변경</DialogTitle>
            <DialogDescription>
              선택된 {selectedStudentIds.size}명의 수업요일을 변경합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">새 수업요일</Label>
              <div className="flex gap-1">
                {DAY_LABELS.map((label, idx) => (
                  <Button
                    key={idx}
                    variant={bulkDays.includes(idx) ? "default" : "outline"}
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => {
                      setBulkDays((prev) =>
                        prev.includes(idx)
                          ? prev.filter((d) => d !== idx)
                          : [...prev, idx].sort()
                      );
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {bulkDays.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  선택: {bulkDays.map((d) => DAY_LABELS[d]).join(", ")}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">적용일 (예약)</Label>
              <Input
                type="date"
                value={bulkEffectiveDate}
                onChange={(e) => setBulkEffectiveDate(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                비워두면 즉시 적용됩니다
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDayDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleBulkDayChange}
              disabled={bulkDays.length === 0 || bulkDaySubmitting}
            >
              {bulkDaySubmitting ? "변경 중..." : `${selectedStudentIds.size}명 변경`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>자동 진급</DialogTitle>
          </DialogHeader>
          {promoteLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">
                진급 대상 학생이 없습니다
              </p>
              <p className="mt-1 text-xs text-slate-400">
                고1→고2, 고2→고3, 고3→N수 대상만 포함됩니다
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-slate-600">
                총 <span className="font-bold text-blue-600">{promotions.length}명</span>의 학생이 진급 대상입니다
              </p>
              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학생 ID</TableHead>
                      <TableHead>현재</TableHead>
                      <TableHead>→</TableHead>
                      <TableHead>변경</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((p) => (
                      <TableRow key={p.student_id}>
                        <TableCell>#{p.student_id}</TableCell>
                        <TableCell>{p.from_grade}</TableCell>
                        <TableCell className="text-slate-400">→</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {p.to_grade}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPromoteDialog(false)}
            >
              취소
            </Button>
            {promotions.length > 0 && (
              <Button
                onClick={handlePromoteExecute}
                disabled={promoteExecuting}
              >
                {promoteExecuting
                  ? "진급 중..."
                  : `${promotions.length}명 진급 실행`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
