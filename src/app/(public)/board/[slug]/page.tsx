"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { scoreboardAPI } from "@/lib/api/scoreboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight } from "lucide-react";

export default function ScoreboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await scoreboardAPI.get(slug);
        setBoard(data);
      } catch {
        setBoard(null);
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

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">스코어보드를 찾을 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{board.title || "스코어보드"}</h1>
          {board.academy_name && (
            <p className="mt-1 text-sm text-slate-500">{board.academy_name}</p>
          )}
          {board.description && (
            <p className="mt-2 text-sm text-slate-400">{board.description}</p>
          )}
        </div>

        {board.categories?.length > 0 ? (
          <div className="space-y-4">
            {board.categories.map((cat: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                  {cat.description && (
                    <CardDescription>{cat.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {cat.top_scores?.length > 0 ? (
                    <div className="space-y-2">
                      {cat.top_scores.map((score: any, j: number) => (
                        <div
                          key={j}
                          className="flex items-center justify-between rounded-lg border px-4 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                              {j + 1}
                            </span>
                            <span className="text-sm font-medium">{score.student_name}</span>
                          </div>
                          <Badge variant="secondary">{score.value}{score.unit || ""}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400">기록이 없습니다</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              아직 등록된 기록이 없습니다
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link href={`/board/${slug}/scores`}>
            <Button variant="outline">
              전체 점수 보기
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
