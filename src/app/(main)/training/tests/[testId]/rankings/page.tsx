"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Medal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testsAPI } from "@/lib/api/training";
import type { TestRanking } from "@/lib/types/training";
import { RECORD_COLUMNS } from "@/lib/types/training";

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-400",
};

export default function RankingsPage() {
  const params = useParams();
  const testId = Number(params.testId);
  const [rankings, setRankings] = useState<TestRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await testsAPI.rankings(testId);
      setRankings(data as TestRanking[]);
    } catch {
      toast.error("순위를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/training/tests/${testId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          테스트 상세로
        </Link>
        <h1 className="text-xl font-bold text-slate-900">테스트 순위</h1>
        <p className="text-sm text-slate-500">
          총점 기준 순위입니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4 text-amber-500" />
            순위표
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              순위 데이터가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">순위</TableHead>
                  <TableHead className="w-[100px]">이름</TableHead>
                  {RECORD_COLUMNS.map((col) => (
                    <TableHead key={col.key} className="text-center">
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">총점</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((entry) => (
                  <TableRow key={entry.student_id}>
                    <TableCell className="text-center">
                      <span
                        className={`font-bold ${RANK_COLORS[entry.rank] ?? "text-slate-600"}`}
                      >
                        {entry.rank}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.student_name}
                      {entry.rank <= 3 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {entry.rank === 1
                            ? "금"
                            : entry.rank === 2
                              ? "은"
                              : "동"}
                        </Badge>
                      )}
                    </TableCell>
                    {RECORD_COLUMNS.map((col) => (
                      <TableCell key={col.key} className="text-center">
                        {entry.records[col.key] ?? "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold">
                      {entry.total_score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
