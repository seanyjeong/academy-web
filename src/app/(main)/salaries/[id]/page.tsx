"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salariesAPI } from "@/lib/api/payments";
import { formatKRW } from "@/lib/format";
import { toast } from "sonner";

interface SalaryDetail {
  id: number;
  instructor_id: number;
  instructor_name: string;
  month: string;
  base_salary: number;
  overtime_pay: number;
  allowance: number;
  deduction: number;
  net_salary: number;
  working_hours?: number;
  overtime_hours?: number;
  lessons?: {
    id: number;
    date: string;
    class_name: string;
    hours: number;
  }[];
}

export default function SalaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [salary, setSalary] = useState<SalaryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSalary = useCallback(async () => {
    try {
      const { data } = await salariesAPI.get(Number(id));
      setSalary(data);
    } catch {
      toast.error("급여 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSalary();
  }, [fetchSalary]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!salary) {
    return (
      <p className="py-20 text-center text-sm text-slate-400">
        급여 정보를 찾을 수 없습니다
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">급여 상세</h1>
        <p className="text-sm text-slate-500">
          {salary.instructor_name}님의 {salary.month} 급여 상세 내역
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>급여 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">기본급</dt>
                <dd className="font-medium">{formatKRW(salary.base_salary)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">초과근무 수당</dt>
                <dd className="font-medium">
                  {formatKRW(salary.overtime_pay)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">추가 수당</dt>
                <dd className="font-medium">{formatKRW(salary.allowance)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">공제</dt>
                <dd className="font-medium text-red-500">
                  -{formatKRW(salary.deduction)}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="font-semibold text-slate-900">실지급액</dt>
                <dd className="font-bold text-lg">
                  {formatKRW(salary.net_salary)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Working hours */}
        <Card>
          <CardHeader>
            <CardTitle>근무 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">총 근무시간</dt>
                <dd className="text-lg font-medium">
                  {salary.working_hours ?? 0}시간
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">초과근무</dt>
                <dd className="text-lg font-medium">
                  {salary.overtime_hours ?? 0}시간
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Lessons */}
        {salary.lessons && salary.lessons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>수업 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>수업명</TableHead>
                    <TableHead className="text-right">시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salary.lessons.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.date}</TableCell>
                      <TableCell>{l.class_name}</TableCell>
                      <TableCell className="text-right">
                        {l.hours}시간
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
