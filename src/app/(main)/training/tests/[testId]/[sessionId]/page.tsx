"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, ClipboardList } from "lucide-react";
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
import type { TestSession } from "@/lib/types/training";

export default function SessionDetailPage() {
  const params = useParams();
  const testId = Number(params.testId);
  const sessionId = Number(params.sessionId);
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await testsAPI.session(testId, sessionId);
      setSession(data as TestSession);
    } catch {
      toast.error("세션 정보를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [testId, sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        세션을 찾을 수 없습니다
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {session.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {session.date}
              </span>
              {session.time_slot && (
                <Badge variant="secondary">
                  {session.time_slot === "morning"
                    ? "오전반"
                    : session.time_slot === "afternoon"
                      ? "오후반"
                      : "저녁반"}
                </Badge>
              )}
            </div>
          </div>
          <Link
            href={`/training/tests/${testId}/${sessionId}/records`}
          >
            <Button>
              <ClipboardList className="h-4 w-4" />
              기록 입력
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">세션 정보</CardTitle>
          <CardDescription>이 세션의 상세 정보입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">세션명</dt>
              <dd className="mt-1 text-slate-900">{session.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">날짜</dt>
              <dd className="mt-1 text-slate-900">{session.date}</dd>
            </div>
            {session.time_slot && (
              <div>
                <dt className="font-medium text-slate-500">시간대</dt>
                <dd className="mt-1 text-slate-900">
                  {session.time_slot === "morning"
                    ? "오전반"
                    : session.time_slot === "afternoon"
                      ? "오후반"
                      : "저녁반"}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
