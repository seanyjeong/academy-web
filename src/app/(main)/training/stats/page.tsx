"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trainingStatsAPI } from "@/lib/api/training";
import type {
  TrainingStats,
  LeaderboardEntry,
  TrendPoint,
} from "@/lib/types/training";

export default function StatsPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, leaderRes] = await Promise.all([
        trainingStatsAPI.overview(),
        trainingStatsAPI.leaderboard(),
      ]);
      const statsData = statsRes.data as TrainingStats;
      setStats(statsData);
      setTrends(statsData.trends ?? []);
      setLeaderboard(leaderRes.data as LeaderboardEntry[]);
    } catch {
      toast.error("통계를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">훈련 통계</h1>
        <p className="text-sm text-slate-500">훈련 현황과 추이를 확인합니다</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ClipboardList className="h-4 w-4" />
              총 기록 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.total_records ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Users className="h-4 w-4" />
              참여 학생 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.total_students ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <TrendingUp className="h-4 w-4" />
              평균 출석률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.avg_attendance ?? 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            훈련 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              추이 데이터가 없습니다
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="기록"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-500" />
            리더보드
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              리더보드 데이터가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">순위</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">점수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow key={`${entry.student_id}-${entry.category}`}>
                    <TableCell className="text-center font-bold">
                      {entry.rank <= 3 ? (
                        <span
                          className={
                            entry.rank === 1
                              ? "text-amber-500"
                              : entry.rank === 2
                                ? "text-slate-400"
                                : "text-orange-400"
                          }
                        >
                          {entry.rank}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.student_name}
                    </TableCell>
                    <TableCell>
                      {entry.category && (
                        <Badge variant="secondary">{entry.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.score}
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
