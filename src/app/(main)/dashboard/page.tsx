"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarCheck, TrendingUp, AlertCircle } from "lucide-react";
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
import { attendanceAPI } from "@/lib/api/attendance";
import { Student, STATUS_LABELS, StudentStatus } from "@/lib/types/student";

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
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    monthIncome: 0,
    unpaidCount: 0,
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsRes, attendanceRes] = await Promise.allSettled([
          studentsAPI.list({ limit: 5 }),
          attendanceAPI.summary(),
        ]);

        if (studentsRes.status === "fulfilled") {
          const data = studentsRes.value.data;
          setRecentStudents(data.items ?? data ?? []);
          setStats((prev) => ({
            ...prev,
            totalStudents: data.total ?? (data.items ?? data).length,
          }));
        }

        if (attendanceRes.status === "fulfilled") {
          const data = attendanceRes.value.data;
          setStats((prev) => ({
            ...prev,
            todayAttendance: data.today_count ?? 0,
            monthIncome: data.month_income ?? 0,
            unpaidCount: data.unpaid_count ?? 0,
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          안녕하세요, {user?.name}님
        </h1>
        <p className="text-sm text-slate-500">오늘의 학원 현황을 확인하세요</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 학생"
          value={stats.totalStudents}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="오늘 출석"
          value={stats.todayAttendance}
          icon={<CalendarCheck className="h-6 w-6 text-green-600" />}
          color="bg-green-50"
          description="명 출석"
        />
        <StatCard
          title="이번달 수입"
          value={`${stats.monthIncome.toLocaleString()}원`}
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          title="미납 건수"
          value={stats.unpaidCount}
          icon={<AlertCircle className="h-6 w-6 text-red-600" />}
          color="bg-red-50"
          description="건 미납"
        />
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
                <TableHead>상태</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>학교</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                        className={STATUS_COLORS[student.status]}
                      >
                        {STATUS_LABELS[student.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {student.phone ?? "-"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {student.school ?? "-"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(student.created_at).toLocaleDateString("ko-KR")}
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
