"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useAcademy } from "@/hooks/use-academy";
import apiClient from "@/lib/api/client";

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
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  const match = Object.entries(BREADCRUMB_MAP).find(
    ([key]) => key !== "/dashboard" && pathname.startsWith(key)
  );
  return match ? match[1] : ["대시보드"];
}

interface SearchResult {
  type: "student" | "consultation" | "schedule";
  id: number;
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_LABELS: Record<string, string> = {
  student: "학생",
  consultation: "상담",
  schedule: "수업",
};

const TYPE_COLORS: Record<string, string> = {
  student: "bg-blue-50 text-blue-600",
  consultation: "bg-green-50 text-green-600",
  schedule: "bg-purple-50 text-purple-600",
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { activeBranchId, isMultiBranch } = useAcademy();
  const breadcrumb = getBreadcrumb(pathname);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search students
      try {
        const { data } = await apiClient.get("/students", {
          params: { search: q, limit: 5 },
        });
        const students = data?.items ?? (Array.isArray(data) ? data : []);
        for (const s of students) {
          searchResults.push({
            type: "student",
            id: s.id,
            title: s.name,
            subtitle: s.phone ?? s.grade ?? undefined,
            href: `/students/${s.id}`,
          });
        }
      } catch {
        // skip
      }

      // Search consultations
      try {
        const { data } = await apiClient.get("/consultations", {
          params: { search: q, limit: 5 },
        });
        const consults = data?.items ?? (Array.isArray(data) ? data : []);
        for (const c of consults) {
          searchResults.push({
            type: "consultation",
            id: c.id,
            title: c.student_name ?? c.name ?? `상담 #${c.id}`,
            subtitle: c.consultation_date ?? undefined,
            href: `/consultations/${c.id}`,
          });
        }
      } catch {
        // skip
      }

      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden items-center gap-1.5 text-sm sm:flex">
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

          {/* Mobile: page title only */}
          <span className="text-sm font-semibold text-slate-900 sm:hidden">
            {breadcrumb[breadcrumb.length - 1]}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">검색...</span>
            <kbd className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
              ⌘K
            </kbd>
          </button>
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

      {/* Global Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[20%] translate-y-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">검색</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="학생, 상담 검색..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {searching && (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${TYPE_COLORS[result.type] ?? ""}`}
                    >
                      {TYPE_LABELS[result.type] ?? result.type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="truncate text-xs text-slate-400">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searching && query.length >= 2 && results.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                검색 결과가 없습니다
              </p>
            )}

            {query.length < 2 && !searching && (
              <p className="py-4 text-center text-sm text-slate-400">
                2글자 이상 입력하세요
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
