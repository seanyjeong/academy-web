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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Users, TrendingUp, CalendarCheck, Download, BarChart3 } from "lucide-react";

interface DashboardData {
  total_students?: number;
  monthly_income?: number;
  attendance_rate?: number;
  new_consultations?: number;
  monthly_trend?: { month: string; amount: number }[];
  max_monthly?: number;
  student_stats?: Record<string, number>;
}

const EXPORT_TYPES = [
  { value: "financial", label: "재무 리포트" },
  { value: "attendance", label: "출결 리포트" },
  { value: "students", label: "학생 목록" },
  { value: "consultations", label: "상담 내역" },
  { value: "salaries", label: "급여 내역" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportsAPI.dashboard({ period });
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type: string) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    try {
      const { data } = await reportsAPI.export(type, { year_month: yearMonth });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${type}-${yearMonth}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("다운로드가 시작되었습니다");
    } catch {
      toast.error("내보내기에 실패했습니다");
    }
  };

  const stats = [
    {
      label: "총 학생수",
      value: dashboard?.total_students ?? "-",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "월 수입",
      value: dashboard?.monthly_income
        ? `${Number(dashboard.monthly_income).toLocaleString()}원`
        : "-",
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "출결율",
      value: dashboard?.attendance_rate
        ? `${dashboard.attendance_rate}%`
        : "-",
      icon: CalendarCheck,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "신규 상담",
      value: dashboard?.new_consultations ?? "-",
      icon: BarChart3,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">리포트</h1>
          <p className="text-sm text-slate-500">학원 운영 현황을 한눈에 확인합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports/performance">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              성과분석
            </Button>
          </Link>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">주간</SelectItem>
              <SelectItem value="month">월간</SelectItem>
              <SelectItem value="quarter">분기</SelectItem>
              <SelectItem value="year">연간</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {EXPORT_TYPES.map((et) => (
                <DropdownMenuItem
                  key={et.value}
                  onClick={() => handleExport(et.value)}
                >
                  {et.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>월별 수입 추이</CardTitle>
                <CardDescription>최근 6개월 수입 현황</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.monthly_trend ? (
                  <div className="space-y-3">
                    {dashboard.monthly_trend.map((m: { month: string; amount: number }, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-16 text-sm text-slate-500">{m.month}</span>
                        <div className="flex-1">
                          <div className="h-6 rounded bg-slate-100">
                            <div
                              className="h-6 rounded bg-blue-500"
                              style={{
                                width: `${Math.min(100, (m.amount / (dashboard.max_monthly || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="w-24 text-right text-sm font-medium">
                          {Number(m.amount).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    데이터가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>학생 현황</CardTitle>
                <CardDescription>상태별 학생 분포</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.student_stats ? (
                  <div className="space-y-3">
                    {Object.entries(dashboard.student_stats).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between rounded-lg border px-4 py-2">
                        <span className="text-sm">{status}</span>
                        <span className="text-sm font-medium">{String(count)}명</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    데이터가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
