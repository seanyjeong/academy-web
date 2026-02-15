"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { incomesAPI } from "@/lib/api/payments";
import { formatKRW, formatDate } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface IncomeSummary {
  total: number;
  categories: { name: string; amount: number }[];
}

interface IncomeItem {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
}

function getMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label =
      i === 0
        ? "이번달"
        : i === 1
          ? "지난달"
          : `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    options.push({ value, label });
  }
  return options;
}

export default function IncomesPage() {
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getMonthOptions()[0].value);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        incomesAPI.summary({ month }),
        incomesAPI.list({ month }),
      ]);
      setSummary(summaryRes.data);
      setItems(
        Array.isArray(listRes.data) ? listRes.data : listRes.data.items ?? []
      );
    } catch {
      setSummary(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthOptions = getMonthOptions();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수입관리</h1>
          <p className="text-sm text-slate-500">월별 수입 현황을 관리합니다</p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">
                  총 수입
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatKRW(summary?.total ?? 0)}
                </p>
              </CardContent>
            </Card>
            {(summary?.categories ?? []).slice(0, 2).map((cat) => (
              <Card key={cat.name}>
                <CardHeader>
                  <CardTitle className="text-sm text-slate-500">
                    {cat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatKRW(cat.amount)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bar chart */}
          {summary?.categories && summary.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 수입</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.categories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis
                        fontSize={12}
                        tickFormatter={(v: number) =>
                          `${(v / 10000).toFixed(0)}만`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatKRW(Number(value ?? 0)),
                          "수입",
                        ]}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Income list */}
          <Card>
            <CardHeader>
              <CardTitle>수입 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  수입 내역이 없습니다
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>내용</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatKRW(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
