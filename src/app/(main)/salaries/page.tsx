"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salariesAPI } from "@/lib/api/payments";
import { formatKRW } from "@/lib/format";
import { toast } from "sonner";

interface Salary {
  id: number;
  instructor_id: number;
  instructor_name?: string;
  year_month: string;
  base_salary: number;
  overtime_pay: number;
  incentive: number;
  deductions: number;
  total_salary: number;
  payment_status: string;
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

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getMonthOptions()[0].value);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(
    getMonthOptions()[0].value
  );
  const [generating, setGenerating] = useState(false);

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await salariesAPI.list({ month });
      setSalaries(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await salariesAPI.calculate({ month: generateMonth });
      toast.success("급여가 생성되었습니다");
      setGenerateOpen(false);
      setMonth(generateMonth);
      fetchSalaries();
    } catch {
      toast.error("급여 생성에 실패했습니다");
    } finally {
      setGenerating(false);
    }
  };

  const monthOptions = getMonthOptions();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">급여관리</h1>
          <p className="text-sm text-slate-500">강사별 급여를 관리합니다</p>
        </div>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              급여 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>급여 생성</DialogTitle>
              <DialogDescription>
                해당 월의 급여를 일괄 생성합니다
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="gen-month">대상 월</Label>
              <Input
                id="gen-month"
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setGenerateOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>급여 목록</CardTitle>
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : salaries.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              급여 내역이 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>강사명</TableHead>
                  <TableHead className="text-right">기본급</TableHead>
                  <TableHead className="text-right">초과근무</TableHead>
                  <TableHead className="text-right">수당</TableHead>
                  <TableHead className="text-right">공제</TableHead>
                  <TableHead className="text-right">실지급</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/salaries/${s.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {s.instructor_name ?? `강사 #${s.instructor_id}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatKRW(s.base_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatKRW(s.overtime_pay)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatKRW(s.incentive)}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      -{formatKRW(s.deductions)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatKRW(s.total_salary)}
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
