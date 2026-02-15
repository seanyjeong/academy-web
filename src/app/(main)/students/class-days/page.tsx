"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentsAPI } from "@/lib/api/students";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
};

interface ClassDayRow {
  student_id: number;
  student_name: string;
  days: Record<string, boolean>;
}

export default function ClassDaysPage() {
  const [rows, setRows] = useState<ClassDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [changed, setChanged] = useState<Set<number>>(new Set());

  const fetchClassDays = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentsAPI.classDays();
      const items = data.items ?? data ?? [];
      setRows(
        items.map((item: Record<string, unknown>) => ({
          student_id: item.student_id as number,
          student_name: item.student_name as string,
          days: (item.days as Record<string, boolean>) ?? {},
        }))
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassDays();
  }, [fetchClassDays]);

  function toggleDay(studentId: number, day: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? { ...r, days: { ...r.days, [day]: !r.days[day] } }
          : r
      )
    );
    setChanged((prev) => new Set(prev).add(studentId));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = rows.filter((r) => changed.has(r.student_id));
      await Promise.all(
        updates.map((r) =>
          studentsAPI.updateClassDays(r.student_id, { days: r.days })
        )
      );
      toast.success("수업 요일이 저장되었습니다");
      setChanged(new Set());
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  const filteredRows =
    filter === "all"
      ? rows
      : rows.filter((r) => {
          const name = r.student_name.toLowerCase();
          return name.includes(filter);
        });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수업 요일 관리</h1>
          <p className="text-sm text-slate-500">
            학생별 수업 요일을 설정합니다
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || changed.size === 0}>
          {saving ? "저장 중..." : "변경사항 저장"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              수업 요일표 ({filteredRows.length}명)
            </CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="morning">오전</SelectItem>
                <SelectItem value="afternoon">오후</SelectItem>
                <SelectItem value="evening">저녁</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              학생이 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생명</TableHead>
                  {DAYS.map((d) => (
                    <TableHead key={d} className="text-center w-16">
                      {DAY_LABELS[d]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.student_id}>
                    <TableCell className="font-medium text-slate-900">
                      {row.student_name}
                    </TableCell>
                    {DAYS.map((d) => (
                      <TableCell key={d} className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleDay(row.student_id, d)}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                            row.days[d]
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {row.days[d] ? "O" : ""}
                        </button>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
