"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testsAPI } from "@/lib/api/training";
import type { TestRecord } from "@/lib/types/training";
import { RECORD_COLUMNS } from "@/lib/types/training";

export default function SessionRecordsPage() {
  const params = useParams();
  const testId = Number(params.testId);
  const sessionId = Number(params.sessionId);
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await testsAPI.sessionRecords(testId, sessionId);
      setRecords(data as TestRecord[]);
    } catch {
      toast.error("기록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [testId, sessionId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const updateRecord = (
    studentIdx: number,
    key: string,
    value: string
  ) => {
    setRecords((prev) =>
      prev.map((r, i) =>
        i === studentIdx
          ? { ...r, records: { ...r.records, [key]: value || null } }
          : r
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await testsAPI.saveRecords(testId, sessionId, { records });
      toast.success("기록이 저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/training/tests/${testId}/${sessionId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          세션으로
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">기록 입력</h1>
            <p className="text-sm text-slate-500">
              학생별 테스트 기록을 입력합니다
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save />
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">학생별 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 학생이 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">이름</TableHead>
                  {RECORD_COLUMNS.map((col) => (
                    <TableHead key={col.key} className="text-center">
                      {col.label}
                      <span className="ml-1 text-xs text-slate-400">
                        ({col.unit})
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, idx) => (
                  <TableRow key={record.student_id}>
                    <TableCell className="font-medium">
                      {record.student_name}
                    </TableCell>
                    {RECORD_COLUMNS.map((col) => (
                      <TableCell key={col.key} className="text-center">
                        <Input
                          type="number"
                          step="any"
                          value={
                            record.records[col.key] != null
                              ? String(record.records[col.key])
                              : ""
                          }
                          onChange={(e) =>
                            updateRecord(idx, col.key, e.target.value)
                          }
                          className="h-8 w-[80px] text-center"
                          placeholder="-"
                        />
                      </TableCell>
                    ))}
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
