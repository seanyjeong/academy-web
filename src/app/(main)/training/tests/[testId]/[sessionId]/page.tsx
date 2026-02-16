"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { testsAPI, recordTypesAPI } from "@/lib/api/training";
import type { TestSession, TestRecord, RecordType } from "@/lib/types/training";

interface SessionParticipant {
  id: number;
  student_id: number;
  student_name?: string;
}

interface RecordCell {
  id?: number;
  value: string;
  score: string;
  grade: string;
}

type StudentRow = {
  student_id: number;
  student_name: string;
  cells: Record<number, RecordCell>;
  dirty: boolean;
};

export default function SessionDetailPage() {
  const params = useParams();
  const testId = Number(params.testId);
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<TestSession | null>(null);
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    studentName: string;
    recordId: number;
  } | null>(null);

  const dirtyRef = useRef(new Set<string>());

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await testsAPI.getSession(testId, sessionId);
      setSession(data as TestSession);
    } catch {
      toast.error("세션 정보를 불러오지 못했습니다");
    }
  }, [testId, sessionId]);

  const fetchRecordTypes = useCallback(async () => {
    try {
      const { data } = await recordTypesAPI.list();
      const list = Array.isArray(data) ? (data as RecordType[]) : [];
      setRecordTypes(list.filter((rt) => rt.is_active));
    } catch {
      toast.error("종목 정보를 불러오지 못했습니다");
    }
  }, []);

  const buildRows = useCallback(
    (
      participants: SessionParticipant[],
      records: TestRecord[],
      types: RecordType[]
    ) => {
      const recordMap = new Map<string, TestRecord>();
      for (const rec of records) {
        recordMap.set(`${rec.student_id}-${rec.record_type_id}`, rec);
      }

      return participants.map((p): StudentRow => {
        const cells: Record<number, RecordCell> = {};
        for (const rt of types) {
          const rec = recordMap.get(`${p.student_id}-${rt.id}`);
          cells[rt.id] = {
            id: rec?.id,
            value: rec?.value != null ? String(rec.value) : "",
            score: rec?.score != null ? String(rec.score) : "",
            grade: rec?.grade ?? "",
          };
        }
        return {
          student_id: p.student_id,
          student_name: p.student_name ?? `학생 #${p.student_id}`,
          cells,
          dirty: false,
        };
      });
    },
    []
  );

  const fetchRecordsAndParticipants = useCallback(async () => {
    try {
      const [partRes, recRes] = await Promise.all([
        testsAPI.sessionParticipants(sessionId),
        testsAPI.sessionRecords(sessionId),
      ]);
      const participants = Array.isArray(partRes.data)
        ? (partRes.data as SessionParticipant[])
        : [];
      const records = Array.isArray(recRes.data)
        ? (recRes.data as TestRecord[])
        : [];
      setRows(buildRows(participants, records, recordTypes));
      dirtyRef.current.clear();
    } catch {
      toast.error("기록을 불러오지 못했습니다");
    }
  }, [sessionId, recordTypes, buildRows]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSession(), fetchRecordTypes()]);
    setLoading(false);
  }, [fetchSession, fetchRecordTypes]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (recordTypes.length > 0) {
      fetchRecordsAndParticipants();
    }
  }, [recordTypes, fetchRecordsAndParticipants]);

  const updateCell = (
    studentId: number,
    recordTypeId: number,
    field: "value" | "score" | "grade",
    val: string
  ) => {
    dirtyRef.current.add(`${studentId}-${recordTypeId}`);
    setRows((prev) =>
      prev.map((row) => {
        if (row.student_id !== studentId) return row;
        return {
          ...row,
          dirty: true,
          cells: {
            ...row.cells,
            [recordTypeId]: {
              ...row.cells[recordTypeId],
              [field]: val,
            },
          },
        };
      })
    );
  };

  const handleSaveAll = async () => {
    const dirtyKeys = dirtyRef.current;
    if (dirtyKeys.size === 0) {
      toast.info("변경된 기록이 없습니다");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      for (const rt of recordTypes) {
        const key = `${row.student_id}-${rt.id}`;
        if (!dirtyKeys.has(key)) continue;

        const cell = row.cells[rt.id];
        const hasValue = cell.value.trim() !== "";

        try {
          if (cell.id) {
            if (!hasValue) {
              await testsAPI.deleteSessionRecord(sessionId, cell.id);
            } else {
              await testsAPI.updateSessionRecord(sessionId, cell.id, {
                value: parseFloat(cell.value),
                score: cell.score ? parseFloat(cell.score) : null,
                grade: cell.grade || null,
              });
            }
          } else if (hasValue) {
            await testsAPI.createSessionRecord(sessionId, {
              student_id: row.student_id,
              record_type_id: rt.id,
              value: parseFloat(cell.value),
              score: cell.score ? parseFloat(cell.score) : null,
              grade: cell.grade || null,
            });
          }
          successCount++;
        } catch {
          errorCount++;
        }
      }
    }

    setSaving(false);
    dirtyRef.current.clear();

    if (errorCount > 0) {
      toast.error(`${errorCount}건 저장 실패, ${successCount}건 성공`);
    } else {
      toast.success(`${successCount}건 저장 완료`);
    }

    fetchRecordsAndParticipants();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await testsAPI.syncSessionParticipants(sessionId, {});
      toast.success("참가자가 동기화되었습니다");
      fetchRecordsAndParticipants();
    } catch {
      toast.error("동기화에 실패했습니다");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    try {
      await testsAPI.deleteSessionRecord(sessionId, deleteTarget.recordId);
      toast.success("기록이 삭제되었습니다");
      setShowDeleteConfirm(false);
      fetchRecordsAndParticipants();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

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
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/training/tests/${testId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          테스트 상세로
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">세션 기록</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {session.date}
              </span>
              {(session.start_time || session.end_time) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {session.start_time ?? ""}
                  {session.end_time ? ` ~ ${session.end_time}` : ""}
                </span>
              )}
              <Badge variant="secondary">
                <Users className="mr-1 h-3 w-3" />
                {rows.length}명
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              참가자 동기화
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "일괄 저장"}
            </Button>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">학생별 기록</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded border border-yellow-200 bg-yellow-50" />
              미입력
              <span className="inline-block h-3 w-3 rounded border border-blue-200 bg-blue-50" />
              수정됨
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              등록된 참가자가 없습니다. 참가자 동기화를 실행해주세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 min-w-[100px] bg-white">
                      이름
                    </TableHead>
                    {recordTypes.map((rt) => (
                      <TableHead
                        key={rt.id}
                        className="min-w-[120px] text-center"
                      >
                        <div>{rt.name}</div>
                        <div className="text-xs font-normal text-slate-400">
                          {rt.unit ? `(${rt.unit})` : ""}{" "}
                          {rt.direction === "lower" ? "↓" : "↑"}
                        </div>
                      </TableHead>
                    ))}
                    {recordTypes.length > 0 && (
                      <TableHead className="text-center">점수합계</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const totalScore = recordTypes.reduce((sum, rt) => {
                      const s = parseFloat(row.cells[rt.id]?.score || "0");
                      return sum + (isNaN(s) ? 0 : s);
                    }, 0);

                    return (
                      <TableRow key={row.student_id}>
                        <TableCell className="sticky left-0 z-10 bg-white font-medium">
                          {row.student_name}
                        </TableCell>
                        {recordTypes.map((rt) => {
                          const cell = row.cells[rt.id];
                          const isEmpty = !cell?.value?.trim();
                          const isDirty = dirtyRef.current.has(
                            `${row.student_id}-${rt.id}`
                          );
                          return (
                            <TableCell
                              key={rt.id}
                              className={`text-center ${
                                isDirty
                                  ? "bg-blue-50"
                                  : isEmpty
                                    ? "bg-yellow-50"
                                    : ""
                              }`}
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <Input
                                  type="number"
                                  step="any"
                                  value={cell?.value ?? ""}
                                  onChange={(e) =>
                                    updateCell(
                                      row.student_id,
                                      rt.id,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 w-[80px] text-center text-sm"
                                  placeholder="-"
                                />
                                {cell?.score && (
                                  <span className="text-xs text-blue-600">
                                    {cell.score}점
                                  </span>
                                )}
                                {cell?.grade && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {cell.grade}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                        {recordTypes.length > 0 && (
                          <TableCell className="text-center font-bold">
                            {totalScore > 0 ? totalScore : "-"}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-slate-500">날짜</dt>
              <dd className="mt-1 text-slate-900">{session.date}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">시작 시간</dt>
              <dd className="mt-1 text-slate-900">
                {session.start_time ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">종료 시간</dt>
              <dd className="mt-1 text-slate-900">
                {session.end_time ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">참가자 수</dt>
              <dd className="mt-1 text-slate-900">{rows.length}명</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">종목 수</dt>
              <dd className="mt-1 text-slate-900">{recordTypes.length}개</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Delete Record Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기록 삭제</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-slate-600">
            {deleteTarget?.studentName}의 기록을 삭제하시겠습니까?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecord}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
