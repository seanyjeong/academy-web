"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useAcademy } from "@/hooks/use-academy";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, fetchMe } = useAuth();
  const { fetchBranches } = useAcademy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) fetchBranches();
  }, [user, fetchBranches]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
