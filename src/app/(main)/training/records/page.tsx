"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  ArrowUp,
  ArrowDown,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  recordTypesAPI,
  recordsAPI,
  assignmentsAPI,
} from "@/lib/api/training";
import type {
  RecordType,
  StudentRecord,
  DailyAssignment,
} from "@/lib/types/training";
import { TIME_SLOT_MAP } from "@/lib/types/training";

type TimeSlot = "morning" | "afternoon" | "evening";

interface CellValue {
  recordId?: number;
  value: string;
  dirty: boolean;
  saved: boolean;
}

// Student row: one row per student, cells keyed by record_type_id
interface StudentRow {
  studentId: number;
  studentName: string;
  cells: Record<number, CellValue>;
}

export default function RecordsPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Load record types once
  useEffect(() => {
    (async () => {
      try {
        const { data } = await recordTypesAPI.list();
        const types = (data as RecordType[]).filter((t) => t.is_active);
        types.sort((a, b) => a.display_order - b.display_order);
        setRecordTypes(types);
      } catch {
        toast.error("측정 종목을 불러오지 못했습니다");
      }
    })();
  }, []);

  // Load assignments + records for date + time_slot
  const fetchData = useCallback(async () => {
    if (recordTypes.length === 0) return;
    setLoading(true);
    try {
      const [assignRes, recordRes] = await Promise.all([
        assignmentsAPI.list({ date, time_slot: timeSlot }),
        recordsAPI.byDate({ date }),
      ]);

      const assignments = assignRes.data as (DailyAssignment & {
        student_name?: string;
      })[];
      const records = recordRes.data as (StudentRecord & {
        student_name?: string;
      })[];

      // Build student rows from assignments
      const studentRows: StudentRow[] = assignments.map((a) => {
        const cells: Record<number, CellValue> = {};
        for (const rt of recordTypes) {
          const rec = records.find(
            (r) => r.student_id === a.student_id && r.record_type_id === rt.id
          );
          cells[rt.id] = {
            recordId: rec?.id,
            value: rec?.value != null ? String(rec.value) : "",
            dirty: false,
            saved: rec?.id != null,
          };
        }
        return {
          studentId: a.student_id,
          studentName: a.student_name ?? `#${a.student_id}`,
          cells,
        };
      });

      setRows(studentRows);
    } catch {
      toast.error("기록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [date, timeSlot, recordTypes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cell value change
  const handleCellChange = (
    studentId: number,
    typeId: number,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        return {
          ...row,
          cells: {
            ...row.cells,
            [typeId]: { ...row.cells[typeId], value, dirty: true, saved: false },
          },
        };
      })
    );
  };

  // Save single cell on blur/Enter
  const handleCellSave = async (
    studentId: number,
    typeId: number
  ) => {
    const row = rows.find((r) => r.studentId === studentId);
    if (!row) return;
    const cell = row.cells[typeId];
    if (!cell.dirty || cell.value === "") return;

    try {
      const numValue = parseFloat(cell.value);
      if (isNaN(numValue)) return;

      if (cell.recordId) {
        await recordsAPI.update(cell.recordId, {
          value: numValue,
          measured_at: date,
        });
      } else {
        await recordsAPI.create({
          student_id: studentId,
          record_type_id: typeId,
          value: numValue,
          measured_at: date,
        });
      }

      setRows((prev) =>
        prev.map((r) => {
          if (r.studentId !== studentId) return r;
          return {
            ...r,
            cells: {
              ...r.cells,
              [typeId]: { ...r.cells[typeId], dirty: false, saved: true },
            },
          };
        })
      );
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  // Tab navigation between cells
  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIdx: number,
    colIdx: number,
    studentId: number,
    typeId: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCellSave(studentId, typeId);
      // Move to next row same column
      const nextKey = `${rowIdx + 1}-${colIdx}`;
      inputRefs.current.get(nextKey)?.focus();
    } else if (e.key === "Tab" && !e.shiftKey) {
      // Tab moves to next column
      const nextKey = `${rowIdx}-${colIdx + 1}`;
      if (inputRefs.current.has(nextKey)) {
        e.preventDefault();
        handleCellSave(studentId, typeId);
        inputRefs.current.get(nextKey)?.focus();
      }
    }
  };

  // Batch save all dirty cells
  const handleBatchSave = async () => {
    const dirtyRecords: Array<{
      student_id: number;
      record_type_id: number;
      value: number;
      measured_at: string;
    }> = [];

    for (const row of rows) {
      for (const rt of recordTypes) {
        const cell = row.cells[rt.id];
        if (cell.dirty && cell.value !== "") {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            dirtyRecords.push({
              student_id: row.studentId,
              record_type_id: rt.id,
              value: numValue,
              measured_at: date,
            });
          }
        }
      }
    }

    if (dirtyRecords.length === 0) {
      toast.info("변경된 기록이 없습니다");
      return;
    }

    setSaving(true);
    try {
      await recordsAPI.batchCreate({ records: dirtyRecords });
      toast.success(`${dirtyRecords.length}건 저장되었습니다`);
      fetchData();
    } catch {
      toast.error("일괄 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const totalStudents = rows.length;
  const recordedStudents = rows.filter((row) =>
    recordTypes.some((rt) => row.cells[rt.id]?.value !== "")
  ).length;
  const completionRate =
    totalStudents > 0
      ? Math.round((recordedStudents / totalStudents) * 100)
      : 0;
  const dirtyCount = rows.reduce(
    (acc, row) =>
      acc +
      recordTypes.filter((rt) => row.cells[rt.id]?.dirty).length,
    0
  );

  const prevDate = () =>
    setDate((prev) => format(subDays(parseISO(prev), 1), "yyyy-MM-dd"));
  const nextDate = () =>
    setDate((prev) => format(addDays(parseISO(prev), 1), "yyyy-MM-dd"));
  const goToday = () => setDate(format(new Date(), "yyyy-MM-dd"));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">측정기록</h1>
          <p className="text-sm text-slate-500">
            학생별 훈련 측정 기록을 관리합니다
          </p>
        </div>
        <Button onClick={handleBatchSave} disabled={saving || dirtyCount === 0}>
          <Save className="h-4 w-4" />
          {saving ? "저장 중..." : "일괄 저장"}
          {dirtyCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {dirtyCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">배정 학생</p>
              <p className="text-lg font-bold">{totalStudents}명</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <ClipboardCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">입력 완료</p>
              <p className="text-lg font-bold">{recordedStudents}명</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Check className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">완료율</p>
              <p className="text-lg font-bold">{completionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {/* Date Nav */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevDate}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center font-medium">
                {date}
              </span>
              <Button variant="outline" size="icon" onClick={nextDate}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToday}>
                오늘
              </Button>
            </div>
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border border-green-300 bg-green-50" />
                입력완료
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border border-slate-200 bg-white" />
                미입력
              </span>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Tabs
            value={timeSlot}
            onValueChange={(v) => setTimeSlot(v as TimeSlot)}
          >
            <TabsList>
              {(Object.entries(TIME_SLOT_MAP) as [TimeSlot, string][]).map(
                ([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            {/* Single content area, filtered by timeSlot state */}
            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  {recordTypes.length === 0
                    ? "측정 종목이 등록되지 않았습니다"
                    : "배정된 학생이 없습니다"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 w-[100px] bg-white">
                          이름
                        </TableHead>
                        {recordTypes.map((rt) => (
                          <TableHead
                            key={rt.id}
                            className="min-w-[100px] text-center"
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="flex items-center gap-1">
                                {rt.name}
                                {rt.direction === "lower" ? (
                                  <ArrowDown className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <ArrowUp className="h-3 w-3 text-red-500" />
                                )}
                              </span>
                              {rt.unit && (
                                <span className="text-xs font-normal text-slate-400">
                                  ({rt.unit})
                                </span>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, rowIdx) => (
                        <TableRow key={row.studentId}>
                          <TableCell className="sticky left-0 z-10 bg-white font-medium">
                            {row.studentName}
                          </TableCell>
                          {recordTypes.map((rt, colIdx) => {
                            const cell = row.cells[rt.id];
                            const hasValue = cell?.value !== "";
                            const isSaved = cell?.saved && !cell?.dirty;

                            return (
                              <TableCell
                                key={rt.id}
                                className={`text-center ${
                                  hasValue && isSaved
                                    ? "bg-green-50"
                                    : cell?.dirty
                                      ? "bg-yellow-50"
                                      : ""
                                }`}
                              >
                                <div className="relative flex items-center justify-center">
                                  <Input
                                    ref={(el) => {
                                      if (el)
                                        inputRefs.current.set(
                                          `${rowIdx}-${colIdx}`,
                                          el
                                        );
                                    }}
                                    type="number"
                                    step="any"
                                    value={cell?.value ?? ""}
                                    onChange={(e) =>
                                      handleCellChange(
                                        row.studentId,
                                        rt.id,
                                        e.target.value
                                      )
                                    }
                                    onBlur={() =>
                                      handleCellSave(row.studentId, rt.id)
                                    }
                                    onKeyDown={(e) =>
                                      handleKeyDown(
                                        e,
                                        rowIdx,
                                        colIdx,
                                        row.studentId,
                                        rt.id
                                      )
                                    }
                                    className="h-8 w-[90px] text-center"
                                    placeholder="-"
                                  />
                                  {isSaved && hasValue && (
                                    <Check className="absolute right-1 h-3 w-3 text-green-500" />
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
