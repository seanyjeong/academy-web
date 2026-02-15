"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { scoreboardAPI } from "@/lib/api/scoreboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";

export default function ScoreboardScoresPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await scoreboardAPI.scores(slug);
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">점수 정보를 찾을 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scores = Array.isArray(data) ? data : data.scores || [];

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/board/${slug}`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            스코어보드로 돌아가기
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <h1 className="text-xl font-bold text-slate-900">
              {data.title || "전체 점수"}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">점수 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">순위</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>종목</TableHead>
                  <TableHead>기록</TableHead>
                  <TableHead>날짜</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                      기록이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  scores.map((s: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            i < 3
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{s.student_name}</TableCell>
                      <TableCell>{s.category || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {s.value}{s.unit || ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {s.recorded_at?.slice(0, 10) || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
