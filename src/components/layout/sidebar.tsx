"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAcademy } from "@/hooks/use-academy";
import { MENU_SECTIONS } from "./sidebar-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission, hasModule } = useAuth();
  const { branches, activeBranchId, isMultiBranch, switchBranch } = useAcademy();

  return (
    <aside className="flex h-screen w-[248px] flex-col border-r bg-[#FAFBFC]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          A
        </div>
        <span className="text-base font-semibold text-slate-900">Academy</span>
      </div>

      {/* Branch selector */}
      {isMultiBranch && (
        <div className="border-b px-3 py-2">
          <Select
            value={activeBranchId ? String(activeBranchId) : "all"}
            onValueChange={(v) => switchBranch(v === "all" ? null : Number(v))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Menu sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {MENU_SECTIONS.filter((section) => hasModule(section.module)).map(
          (section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-4">
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          }
        )}
      </nav>

      {/* User / Logout */}
      <div className="border-t px-3 py-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
        >
          <LogOut className="h-[18px] w-[18px]" />
          로그아웃
        </button>
        {user && (
          <p className="mt-1 px-3 text-xs text-slate-400">
            {user.name} ({user.role})
          </p>
        )}
      </div>
    </aside>
  );
}
