"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { consultationsAPI } from "@/lib/api/consultations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Calendar, UserCheck } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "대기", variant: "secondary" },
  in_progress: { label: "진행중", variant: "default" },
  completed: { label: "완료", variant: "outline" },
  cancelled: { label: "취소", variant: "destructive" },
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const { data } = await consultationsAPI.list(params);
      setConsultations(Array.isArray(data) ? data : data.data || []);
    } catch {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">상담관리</h1>
          <p className="text-sm text-slate-500">상담 문의 및 진행 현황을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Link href="/consultations/calendar">
            <Button variant="outline" size="sm">
              <Calendar className="mr-1.5 h-4 w-4" />
              캘린더
            </Button>
          </Link>
          <Link href="/consultations/enrolled">
            <Button variant="outline" size="sm">
              <UserCheck className="mr-1.5 h-4 w-4" />
              등록목록
            </Button>
          </Link>
          <Link href="/consultations/new-inquiry">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              새 문의
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="이름, 연락처 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="in_progress">진행중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="cancelled">취소</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>상담일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>메모</TableHead>
              <TableHead className="w-[100px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : consultations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  상담 내역이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              consultations.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.student_name || c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.consultation_date || c.created_at?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_MAP[c.status]?.variant || "secondary"}>
                      {STATUS_MAP[c.status]?.label || c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-slate-500">
                    {c.memo || "-"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/consultations/${c.id}/conduct`}>
                      <Button variant="ghost" size="sm">
                        상담진행
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
