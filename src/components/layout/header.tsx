"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useAcademy } from "@/hooks/use-academy";

const BREADCRUMB_MAP: Record<string, string[]> = {
  "/dashboard": ["대시보드"],
  "/students": ["학원 운영", "학생관리"],
  "/attendance": ["학원 운영", "출결관리"],
  "/schedules": ["학원 운영", "수업일정"],
  "/seasons": ["학원 운영", "시즌관리"],
  "/instructors": ["학원 운영", "강사관리"],
  "/payments": ["재무", "수납관리"],
  "/salaries": ["재무", "급여관리"],
  "/incomes": ["재무", "수입관리"],
  "/expenses": ["재무", "지출관리"],
  "/consultations": ["상담", "상담관리"],
  "/training/records": ["훈련", "측정기록"],
  "/training/plans": ["훈련", "훈련계획"],
  "/training/logs": ["훈련", "훈련일지"],
  "/training/exercises": ["훈련", "운동관리"],
  "/training/presets": ["훈련", "프리셋"],
  "/training/tests": ["훈련", "월간테스트"],
  "/training/assignments": ["훈련", "반배정"],
  "/training/stats": ["훈련", "통계"],
  "/reports": ["관리", "리포트"],
  "/settings": ["관리", "설정"],
  "/staff": ["관리", "직원관리"],
  "/sms": ["관리", "SMS"],
};

function getBreadcrumb(pathname: string): string[] {
  // Exact match
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  // Prefix match (e.g. /students/123 → 학생관리)
  const match = Object.entries(BREADCRUMB_MAP).find(
    ([key]) => key !== "/dashboard" && pathname.startsWith(key)
  );
  return match ? match[1] : ["대시보드"];
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeBranchId, isMultiBranch } = useAcademy();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">&gt;</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "font-semibold text-slate-900"
                  : "text-slate-400"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
        {activeBranchId === null && isMultiBranch && (
          <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-600">
            통합 조회
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="검색..."
            className="h-9 w-[200px] pl-9 text-sm"
          />
        </div>
        <button className="relative rounded-lg p-2 hover:bg-slate-100">
          <Bell className="h-5 w-5 text-slate-500" />
        </button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-100 text-sm text-blue-600">
            {user?.name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
