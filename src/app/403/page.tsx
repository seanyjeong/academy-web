import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <ShieldX className="h-16 w-16 text-slate-300" />
      <h1 className="text-2xl font-bold text-slate-900">접근 권한이 없습니다</h1>
      <p className="text-sm text-slate-500">이 페이지에 접근할 수 있는 권한이 없습니다.</p>
      <Button asChild>
        <Link href="/dashboard">대시보드로 돌아가기</Link>
      </Button>
    </div>
  );
}
