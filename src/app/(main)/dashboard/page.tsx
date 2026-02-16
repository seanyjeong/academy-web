"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  CreditCard,
  UserPlus,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { studentsAPI } from "@/lib/api/students";
import { reportsAPI } from "@/lib/api/admin";
import { formatKRW, formatDate } from "@/lib/format";
import {
  Student,
  STATUS_LABELS,
  StudentStatus,
  STUDENT_TYPE_LABELS,
  StudentType,
  DAY_LABELS,
} from "@/lib/types/student";

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: "bg-blue-50 text-blue-600",
  trial: "bg-amber-50 text-amber-600",
  paused: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
  graduated: "bg-green-50 text-green-600",
  pending: "bg-slate-50 text-slate-400",
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ title, value, icon, color, description }: StatCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TodoItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
}

function TodoItem({ icon, label, count, href }: TodoItemProps) {
  if (count <= 0) return null;
  return (
    <Link href={href}>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-slate-50">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium text-slate-700">
            {label}{" "}
            <span className="font-bold text-blue-600">{count}건</span>
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </div>
    </Link>
  );
}

interface DashboardData {
  total_students: number;
  active_students: number;
  trial_students: number;
  paused_students: number;
  new_this_month: number;
  unpaid_count: number;
  today_consultations: number;
  monthly_revenue: number;
  monthly_collections: number;
  rest_ended_count?: number;
}

function formatClassDays(classDays: number[] | string | undefined): string {
  if (!classDays) return "-";
  const days = typeof classDays === "string" ? JSON.parse(classDays) : classDays;
  if (!Array.isArray(days) || days.length === 0) return "-";
  return days.map((d: number) => DAY_LABELS[d] ?? d).join(", ");
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData>({
    total_students: 0,
    active_students: 0,
    trial_students: 0,
    paused_students: 0,
    new_this_month: 0,
    unpaid_count: 0,
    today_consultations: 0,
    monthly_revenue: 0,
    monthly_collections: 0,
    rest_ended_count: 0,
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, studentsRes] = await Promise.allSettled([
          reportsAPI.dashboard(),
          studentsAPI.list({ limit: 5 }),
        ]);

        if (dashRes.status === "fulfilled") {
          const d = dashRes.value.data?.data ?? dashRes.value.data ?? {};
          setDashboard((prev) => ({
            ...prev,
            ...d,
          }));
        }

        if (studentsRes.status === "fulfilled") {
          const data = studentsRes.value.data;
          const items = data.items ?? data ?? [];
          setRecentStudents(items);
          // Fallback: use student list count if dashboard didn't provide
          setDashboard((prev) => ({
            ...prev,
            total_students: prev.total_students || data.total || items.length,
          }));
        }
      } catch {
        // Dashboard loads gracefully with defaults
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const hasTodos =
    dashboard.unpaid_count > 0 ||
    (dashboard.rest_ended_count ?? 0) > 0 ||
    dashboard.today_consultations > 0 ||
    dashboard.trial_students > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          안녕하세요, {user?.name}님
        </h1>
        <p className="text-sm text-slate-500">오늘의 학원 현황을 확인하세요</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 학생"
          value={dashboard.total_students}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50"
          description={`재원 ${dashboard.active_students}명`}
        />
        <StatCard
          title="이번달 신규"
          value={dashboard.new_this_month}
          icon={<UserPlus className="h-6 w-6 text-green-600" />}
          color="bg-green-50"
          description="명 등록"
        />
        <StatCard
          title="체험 학생"
          value={dashboard.trial_students}
          icon={<CalendarCheck className="h-6 w-6 text-amber-600" />}
          color="bg-amber-50"
          description="명 체험중"
        />
        <StatCard
          title="미납 건수"
          value={dashboard.unpaid_count}
          icon={<AlertCircle className="h-6 w-6 text-red-600" />}
          color="bg-red-50"
          description="건 미납"
        />
      </div>

      {/* Today's Tasks + Monthly Summary row */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Today's Tasks */}
        {hasTodos && (
          <Card>
            <div className="px-6 pt-4">
              <h2 className="text-base font-semibold text-slate-900">
                오늘의 할 일
              </h2>
            </div>
            <CardContent className="space-y-2 pt-3">
              <TodoItem
                icon={<CreditCard className="h-5 w-5 text-red-500" />}
                label="미납 수납"
                count={dashboard.unpaid_count}
                href="/payments?status=unpaid"
              />
              <TodoItem
                icon={<Clock className="h-5 w-5 text-orange-500" />}
                label="휴원 종료 학생"
                count={dashboard.rest_ended_count ?? 0}
                href="/students?status=paused"
              />
              <TodoItem
                icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
                label="오늘 상담"
                count={dashboard.today_consultations}
                href="/consultations"
              />
              <TodoItem
                icon={<CalendarCheck className="h-5 w-5 text-amber-500" />}
                label="체험 학생"
                count={dashboard.trial_students}
                href="/students?status=trial"
              />
            </CardContent>
          </Card>
        )}

        {/* Monthly Summary */}
        <Card>
          <div className="px-6 pt-4">
            <h2 className="text-base font-semibold text-slate-900">
              이번 달 요약
            </h2>
          </div>
          <CardContent className="pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs text-green-600">수납 완료</p>
                <p className="text-lg font-bold text-green-700">
                  {formatKRW(dashboard.monthly_collections)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs text-red-600">미납</p>
                <p className="text-lg font-bold text-red-700">
                  {dashboard.unpaid_count}건
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-600">신규 등록</p>
                <p className="text-lg font-bold text-blue-700">
                  {dashboard.new_this_month}명
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="text-xs text-purple-600">상담</p>
                <p className="text-lg font-bold text-purple-700">
                  {dashboard.today_consultations}건
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Students */}
      <Card>
        <div className="flex items-center justify-between px-6 pt-4">
          <h2 className="text-base font-semibold text-slate-900">
            최근 등록 학생
          </h2>
          <Link
            href="/students"
            className="text-sm text-blue-600 hover:underline"
          >
            전체보기
          </Link>
        </div>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>수업요일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-slate-400"
                  >
                    등록된 학생이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                recentStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link
                        href={`/students/${student.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          student.student_type === "exam"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {STUDENT_TYPE_LABELS[student.student_type] ??
                          student.student_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[student.status]}
                      >
                        {STATUS_LABELS[student.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatClassDays(student.class_days)}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {student.phone ?? "-"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(student.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
