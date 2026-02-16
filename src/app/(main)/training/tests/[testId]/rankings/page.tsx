"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Medal, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { testsAPI, recordTypesAPI } from "@/lib/api/training";
import type {
  TestRanking,
  RecordType,
  MonthlyTest,
} from "@/lib/types/training";

const RANK_MEDALS = [
  "",
  "\uD83E\uDD47",
  "\uD83E\uDD48",
  "\uD83E\uDD49",
] as const;

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-400",
};

interface RankingView extends TestRanking {
  scores?: Record<number, number | null>;
}

export default function RankingsPage() {
  const params = useParams();
  const testId = Number(params.testId);

  const [test, setTest] = useState<MonthlyTest | null>(null);
  const [rankings, setRankings] = useState<RankingView[]>([]);
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [testRes, rankRes, rtRes] = await Promise.all([
        testsAPI.get(testId),
        testsAPI.rankings(testId),
        recordTypesAPI.list(),
      ]);
      setTest(testRes.data as MonthlyTest);
      setRankings(
        Array.isArray(rankRes.data) ? (rankRes.data as RankingView[]) : []
      );
      const types = Array.isArray(rtRes.data)
        ? (rtRes.data as RecordType[])
        : [];
      setRecordTypes(types.filter((rt) => rt.is_active));
    } catch {
      toast.error("순위를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    toast.info("엑셀 다운로드 기능은 준비 중입니다");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/training/tests/${testId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          테스트 상세로
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">테스트 순위</h1>
            {test && (
              <p className="text-sm text-slate-500">
                {test.name} ({test.year_month})
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4 text-amber-500" />
            순위표
          </CardTitle>
          <CardAction>
            <Badge variant="secondary">{rankings.length}명</Badge>
          </CardAction>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">
                      순위
                    </TableHead>
                    <TableHead className="min-w-[100px]">이름</TableHead>
                    {recordTypes.map((rt) => (
                      <TableHead key={rt.id} className="text-center">
                        {rt.name}
                        {rt.unit && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({rt.unit})
                          </span>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">총점</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((entry) => (
                    <TableRow
                      key={entry.student_id}
                      className={entry.rank <= 3 ? "bg-amber-50/30" : ""}
                    >
                      <TableCell className="text-center">
                        <span
                          className={`text-lg font-bold ${RANK_COLORS[entry.rank] ?? "text-slate-600"}`}
                        >
                          {entry.rank <= 3
                            ? RANK_MEDALS[entry.rank]
                            : entry.rank}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.student_name ?? `학생 #${entry.student_id}`}
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
                      {recordTypes.map((rt) => (
                        <TableCell key={rt.id} className="text-center">
                          {entry.scores?.[rt.id] ?? "-"}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold text-blue-600">
                        {entry.total_score}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
