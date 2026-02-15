"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { testsAPI } from "@/lib/api/training";
import type { MonthlyTest, TestSession } from "@/lib/types/training";
import { TEST_STATUS_MAP } from "@/lib/types/training";

export default function TestDetailPage() {
  const params = useParams();
  const testId = Number(params.testId);
  const [test, setTest] = useState<MonthlyTest | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [testRes, sessionsRes] = await Promise.all([
        testsAPI.get(testId),
        testsAPI.sessions(testId),
      ]);
      setTest(testRes.data as MonthlyTest);
      setSessions(sessionsRes.data as TestSession[]);
    } catch {
      toast.error("테스트 정보를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        테스트를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/training/tests"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{test.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {test.date}
              </span>
              <Badge variant="outline">{TEST_STATUS_MAP[test.status]}</Badge>
            </div>
          </div>
          <Link href={`/training/tests/${testId}/rankings`}>
            <Button variant="outline">
              <Trophy className="h-4 w-4" />
              순위 보기
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">세션 목록</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          등록된 세션이 없습니다
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/training/tests/${testId}/${session.id}`}
              className="block"
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-blue-500" />
                    {session.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {session.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {session.time_slot && (
                    <Badge variant="secondary">
                      {session.time_slot === "morning"
                        ? "오전반"
                        : session.time_slot === "afternoon"
                          ? "오후반"
                          : "저녁반"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
