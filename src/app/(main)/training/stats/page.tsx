"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
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
import { trainingStatsAPI, recordTypesAPI, recordsAPI } from "@/lib/api/training";
import type {
  RecordAverage,
  LeaderboardEntry,
  RecordType,
  StudentRecord,
} from "@/lib/types/training";
import { DIRECTION_MAP } from "@/lib/types/training";

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#dc2626",
  "#ca8a04",
  "#4f46e5",
];

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-400",
};

function formatYearMonth(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseYearMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}

function shiftMonth(ym: string, delta: number): string {
  const { year, month } = parseYearMonth(ym);
  const d = new Date(year, month - 1 + delta, 1);
  return formatYearMonth(d);
}

export default function StatsPage() {
  const [yearMonth, setYearMonth] = useState(formatYearMonth(new Date()));
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  const [averages, setAverages] = useState<RecordAverage[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Student trend
  const [studentSearch, setStudentSearch] = useState("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [studentTrendLoading, setStudentTrendLoading] = useState(false);

  const ymLabel = useMemo(() => {
    const { year, month } = parseYearMonth(yearMonth);
    return `${year}년 ${month}월`;
  }, [yearMonth]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await recordTypesAPI.list();
        const types = Array.isArray(data) ? (data as RecordType[]) : [];
        setRecordTypes(types.filter((rt) => rt.is_active));
      } catch {
        toast.error("종목 정보를 불러오지 못했습니다");
      }
    })();
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const avgParams: Record<string, string | number> = {
        year_month: yearMonth,
      };
      const lbParams: Record<string, string | number> = { limit: 10 };

      if (selectedTypeId !== "all") {
        lbParams.record_type_id = Number(selectedTypeId);
      }

      const [avgRes, lbRes] = await Promise.all([
        trainingStatsAPI.averages(avgParams),
        trainingStatsAPI.leaderboard(lbParams),
      ]);

      setAverages(
        Array.isArray(avgRes.data) ? (avgRes.data as RecordAverage[]) : []
      );
      setLeaderboard(
        Array.isArray(lbRes.data) ? (lbRes.data as LeaderboardEntry[]) : []
      );
    } catch {
      toast.error("통계를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [yearMonth, selectedTypeId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const rtMap = useMemo(() => {
    const map = new Map<number, RecordType>();
    for (const rt of recordTypes) {
      map.set(rt.id, rt);
    }
    return map;
  }, [recordTypes]);

  const chartData = useMemo(
    () =>
      averages
        .filter((a) => a.avg_value != null)
        .map((a) => {
          const rt = rtMap.get(a.record_type_id);
          return {
            name: rt?.name ?? `종목 #${a.record_type_id}`,
            value: Math.round((a.avg_value ?? 0) * 100) / 100,
            unit: rt?.unit ?? "",
            count: a.count,
          };
        }),
    [averages, rtMap]
  );

  const getDirectionLabel = (rtId: number) => {
    const rt = rtMap.get(rtId);
    if (!rt) return "";
    return rt.direction === "lower" ? "빠른순" : "높은순";
  };

  const selectedTypeName =
    selectedTypeId === "all"
      ? "전체"
      : (rtMap.get(Number(selectedTypeId))?.name ?? "");

  // Student trend search
  const handleStudentSearch = async () => {
    if (!studentSearch.trim()) return;
    setStudentTrendLoading(true);
    try {
      // Search by student name via leaderboard (which includes student_name)
      const lbRes = await trainingStatsAPI.leaderboard({ limit: 100 });
      const entries = Array.isArray(lbRes.data) ? (lbRes.data as LeaderboardEntry[]) : [];
      const match = entries.find(
        (e) => e.student_name?.includes(studentSearch.trim())
      );
      if (!match) {
        toast.error("해당 학생의 기록을 찾을 수 없습니다");
        setStudentTrendLoading(false);
        return;
      }
      setStudentId(match.student_id);
      setStudentName(match.student_name);
      const recRes = await recordsAPI.list({
        student_id: match.student_id,
        limit: 200,
      });
      const recs = Array.isArray(recRes.data)
        ? recRes.data
        : recRes.data?.items ?? [];
      setStudentRecords(recs as StudentRecord[]);
    } catch {
      toast.error("학생 기록 조회에 실패했습니다");
    } finally {
      setStudentTrendLoading(false);
    }
  };

  const studentTrendData = useMemo(() => {
    if (studentRecords.length === 0) return [];
    const dateMap = new Map<string, Record<string, number>>();
    for (const rec of studentRecords) {
      const date = rec.measured_at.slice(0, 10);
      if (!dateMap.has(date)) dateMap.set(date, {});
      const rt = rtMap.get(rec.record_type_id);
      if (rt) dateMap.get(date)![rt.name] = rec.value;
    }
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, values]) => ({ date: date.slice(5), ...values }));
  }, [studentRecords, rtMap]);

  const studentActiveTypes = useMemo(() => {
    if (studentRecords.length === 0) return [];
    const typeIds = new Set(studentRecords.map((r) => r.record_type_id));
    return recordTypes.filter((rt) => typeIds.has(rt.id));
  }, [studentRecords, recordTypes]);

  if (loading && averages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">훈련 통계</h1>
          <p className="text-sm text-slate-500">
            종목별 평균과 리더보드를 확인합니다
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYearMonth(shiftMonth(yearMonth, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[100px] text-center text-sm font-medium text-slate-700">
            {ymLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYearMonth(shiftMonth(yearMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Input
            type="month"
            value={yearMonth}
            onChange={(e) => e.target.value && setYearMonth(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="종목 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 종목</SelectItem>
            {recordTypes.map((rt) => (
              <SelectItem key={rt.id} value={String(rt.id)}>
                {rt.name}
                {rt.unit ? ` (${rt.unit})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        )}
      </div>

      {/* Average Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {averages.length === 0 ? (
          <div className="col-span-full py-8 text-center text-sm text-slate-400">
            {ymLabel} 평균 데이터가 없습니다
          </div>
        ) : (
          averages.map((avg) => {
            const rt = rtMap.get(avg.record_type_id);
            return (
              <Card key={avg.record_type_id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Activity className="h-4 w-4" />
                    {rt?.name ?? `종목 #${avg.record_type_id}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">
                    {avg.avg_value != null
                      ? Math.round(avg.avg_value * 100) / 100
                      : "-"}
                    {rt?.unit && (
                      <span className="ml-1 text-sm font-normal text-slate-400">
                        {rt.unit}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {avg.count}건 기록
                    {rt?.direction && (
                      <span className="ml-2">
                        ({DIRECTION_MAP[rt.direction]})
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              종목별 평균 ({ymLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value}`, "평균"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" />
            리더보드
            {selectedTypeName !== "전체" && (
              <Badge variant="secondary" className="text-xs">
                {selectedTypeName}
              </Badge>
            )}
          </CardTitle>
          <CardAction>
            {selectedTypeId !== "all" && (
              <Badge variant="outline" className="text-xs">
                {getDirectionLabel(Number(selectedTypeId))}
              </Badge>
            )}
          </CardAction>
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
                  <TableHead className="text-right">최고 기록</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow
                    key={entry.student_id}
                    className={entry.rank <= 3 ? "bg-amber-50/30" : ""}
                  >
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
                    <TableCell className="text-right font-mono">
                      {entry.best_value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Student Trend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-500" />
            학생별 기록 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="학생 이름으로 검색"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleStudentSearch}
              disabled={studentTrendLoading || !studentSearch.trim()}
            >
              {studentTrendLoading ? "검색 중..." : "조회"}
            </Button>
          </div>

          {studentId && studentName && (
            <div className="mb-3">
              <Badge variant="secondary" className="text-sm">
                {studentName}
              </Badge>
            </div>
          )}

          {studentTrendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {studentActiveTypes.map((rt, i) => (
                  <Line
                    key={rt.id}
                    type="monotone"
                    dataKey={rt.name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : studentId ? (
            <div className="py-8 text-center text-sm text-slate-400">
              충분한 기록이 없어 추이를 표시할 수 없습니다
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              학생 이름을 검색하면 기록 추이를 확인할 수 있습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
