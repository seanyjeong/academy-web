"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { seasonsAPI } from "@/lib/api/seasons";
import { studentsAPI } from "@/lib/api/students";
import { Student, STATUS_LABELS, StudentStatus } from "@/lib/types/student";

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: "bg-blue-50 text-blue-600",
  trial: "bg-amber-50 text-amber-600",
  paused: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
  graduated: "bg-green-50 text-green-600",
  pending: "bg-slate-50 text-slate-400",
};

interface SeasonInfo {
  id: number;
  name: string;
}

export default function SeasonEnrollPage() {
  const params = useParams();
  const seasonId = Number(params.id);

  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [seasonRes, studentsRes] = await Promise.allSettled([
        seasonsAPI.get(seasonId),
        studentsAPI.list({ status: "active", limit: 200 }),
      ]);

      if (seasonRes.status === "fulfilled") {
        setSeason(seasonRes.value.data);
      }
      if (studentsRes.status === "fulfilled") {
        const data = studentsRes.value.data;
        setStudents(data.items ?? data ?? []);
      }
    } catch {
      // Load gracefully
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleStudent(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filteredStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredStudents.map((s) => s.id)));
    }
  }

  async function handleEnroll() {
    if (selected.size === 0) return;
    setEnrolling(true);
    try {
      await seasonsAPI.enroll(seasonId, {
        student_ids: Array.from(selected),
      });
      toast.success(`${selected.size}명이 등록되었습니다`);
      setSelected(new Set());
    } catch {
      toast.error("등록에 실패했습니다");
    } finally {
      setEnrolling(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      !search ||
      s.name.includes(search) ||
      s.phone?.includes(search) ||
      s.school?.includes(search)
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seasons">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">
            {season?.name ?? "시즌"} - 학생 등록
          </h1>
          <p className="text-sm text-slate-500">
            시즌에 등록할 학생을 선택하세요
          </p>
        </div>
        <Button onClick={handleEnroll} disabled={selected.size === 0 || enrolling}>
          <UserPlus className="h-4 w-4" />
          {enrolling ? "등록 중..." : `${selected.size}명 등록`}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              학생 선택 ({selected.size}/{filteredStudents.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selected.size === filteredStudents.length
                  ? "선택 해제"
                  : "전체 선택"}
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="이름, 연락처, 학교 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {search
                ? "검색 결과가 없습니다"
                : "등록 가능한 학생이 없습니다"}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredStudents.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-blue-200 bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          isSelected
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {s.school ?? ""} {s.grade ?? ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[s.status]}
                    >
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
