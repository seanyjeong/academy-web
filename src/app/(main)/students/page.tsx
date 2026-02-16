"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
        <Button asChild>
          <Link href="/students/new">
            <Plus className="h-4 w-4" />
            학생 등록
          </Link>
        </Button>
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
                      colSpan={9}
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
    </div>
  );
}
