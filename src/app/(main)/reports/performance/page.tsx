"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { reportsAPI } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";

export default function PerformancePage() {
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.performance({ year_month: yearMonth });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await reportsAPI.export("performance", { year_month: yearMonth });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `performance-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Export failed
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/reports"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          리포트로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">성과분석</h1>
            <p className="text-sm text-slate-500">강사별, 종목별 성과를 분석합니다</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-4 w-4" />
              내보내기
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">평균 출결율</p>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.avg_attendance ?? "-"}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">상담 전환율</p>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.conversion_rate ?? "-"}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">학생 유지율</p>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.retention_rate ?? "-"}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>강사별 성과</CardTitle>
              <CardDescription>담당 학생수 및 출결율 기준</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>강사명</TableHead>
                    <TableHead>담당 학생</TableHead>
                    <TableHead>출결율</TableHead>
                    <TableHead>수업 횟수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.instructors?.length > 0 ? (
                    data.instructors.map((inst: any) => (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{inst.name}</TableCell>
                        <TableCell>{inst.student_count}명</TableCell>
                        <TableCell>{inst.attendance_rate}%</TableCell>
                        <TableCell>{inst.lesson_count}회</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                        데이터가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
