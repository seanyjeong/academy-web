"use client";

import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          안녕하세요, {user?.name}님
        </h1>
        <p className="text-sm text-slate-500">
          오늘의 학원 현황을 확인하세요
        </p>
      </div>
      {/* TODO: stat cards, recent students table */}
      <p className="text-sm text-slate-400">대시보드 구현 예정</p>
    </div>
  );
}
