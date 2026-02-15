"use client";

import { useEffect, useState, useCallback } from "react";
import { consultationsAPI } from "@/lib/api/consultations";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EnrolledConsultationsPage() {
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await consultationsAPI.enrolled();
      setEnrolled(Array.isArray(data) ? data : data.data || []);
    } catch {
      setEnrolled([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/consultations"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          상담관리로 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-slate-900">등록된 상담</h1>
        <p className="text-sm text-slate-500">상담을 통해 등록된 학생 목록</p>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>학교</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : enrolled.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  등록된 상담이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              enrolled.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.student_name || e.name}</TableCell>
                  <TableCell>{e.phone}</TableCell>
                  <TableCell>{e.school || "-"}</TableCell>
                  <TableCell>{e.enrolled_at?.slice(0, 10) || e.created_at?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant="default">등록</Badge>
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
