"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { recordsAPI } from "@/lib/api/training";
import {
  TrainingRecord,
  TIME_SLOT_MAP,
  RECORD_COLUMNS,
} from "@/lib/types/training";

type TimeSlot = "morning" | "afternoon" | "evening";

export default function RecordsPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<
    Record<string, string | number | null>
  >({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    student_name: "",
    records: {} as Record<string, string>,
    memo: "",
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recordsAPI.list({ date, time_slot: timeSlot });
      setRecords(data as TrainingRecord[]);
    } catch {
      toast.error("기록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [date, timeSlot]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const startEdit = (record: TrainingRecord) => {
    setEditingId(record.id);
    setEditValues({ ...record.records, memo: record.memo ?? "" });
  };

  const saveEdit = async (record: TrainingRecord) => {
    try {
      const { memo, ...recValues } = editValues;
      await recordsAPI.create({
        id: record.id,
        student_id: record.student_id,
        date,
        time_slot: timeSlot,
        records: recValues,
        memo,
      });
      setEditingId(null);
      toast.success("저장되었습니다");
      fetchRecords();
    } catch {
      toast.error("저장에 실패했습니다");
    }
  };

  const handleAdd = async () => {
    try {
      await recordsAPI.create({
        ...newRecord,
        date,
        time_slot: timeSlot,
      });
      setShowAddDialog(false);
      setNewRecord({ student_name: "", records: {}, memo: "" });
      toast.success("기록이 추가되었습니다");
      fetchRecords();
    } catch {
      toast.error("추가에 실패했습니다");
    }
  };

  const handleBatchSave = async () => {
    try {
      const batch = records.map((r) => ({
        id: r.id,
        student_id: r.student_id,
        date,
        time_slot: timeSlot,
        records: r.records,
        memo: r.memo,
      }));
      await recordsAPI.batchCreate({ records: batch });
      toast.success("일괄 저장되었습니다");
      fetchRecords();
    } catch {
      toast.error("일괄 저장에 실패했습니다");
    }
  };

  const getCellClass = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "")
      return "bg-yellow-50";
    return "";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">측정기록</h1>
          <p className="text-sm text-slate-500">
            학생별 훈련 측정 기록을 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBatchSave}>
            <Save />
            일괄저장
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus />
            기록입력
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" />
              최고기록
              <span className="inline-block h-3 w-3 rounded bg-yellow-50 border border-yellow-200" />
              미입력
              <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-300" />
              결석
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

            {(Object.keys(TIME_SLOT_MAP) as TimeSlot[]).map((slot) => (
              <TabsContent key={slot} value={slot}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    등록된 기록이 없습니다
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
                        <TableHead>메모</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.student_name}
                          </TableCell>
                          {RECORD_COLUMNS.map((col) => (
                            <TableCell
                              key={col.key}
                              className={`text-center ${getCellClass(record.records[col.key])}`}
                            >
                              {editingId === record.id ? (
                                <Input
                                  type="number"
                                  step="any"
                                  value={
                                    editValues[col.key] != null
                                      ? String(editValues[col.key])
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setEditValues((prev) => ({
                                      ...prev,
                                      [col.key]: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-[80px] text-center"
                                />
                              ) : (
                                <span
                                  className="cursor-pointer"
                                  onClick={() => startEdit(record)}
                                >
                                  {record.records[col.key] ?? "-"}
                                </span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {editingId === record.id ? (
                              <Input
                                value={String(editValues.memo ?? "")}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    memo: e.target.value,
                                  }))
                                }
                                className="h-8"
                              />
                            ) : (
                              <span
                                className="cursor-pointer text-sm text-slate-500"
                                onClick={() => startEdit(record)}
                              >
                                {record.memo || "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === record.id ? (
                              <Button
                                size="sm"
                                onClick={() => saveEdit(record)}
                              >
                                저장
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(record)}
                              >
                                수정
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기록 입력</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>학생 이름</Label>
              <Input
                value={newRecord.student_name}
                onChange={(e) =>
                  setNewRecord((prev) => ({
                    ...prev,
                    student_name: e.target.value,
                  }))
                }
                placeholder="학생 이름"
              />
            </div>
            {RECORD_COLUMNS.map((col) => (
              <div key={col.key} className="grid gap-2">
                <Label>
                  {col.label} ({col.unit})
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={newRecord.records[col.key] ?? ""}
                  onChange={(e) =>
                    setNewRecord((prev) => ({
                      ...prev,
                      records: { ...prev.records, [col.key]: e.target.value },
                    }))
                  }
                  placeholder={`${col.label} 입력`}
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label>메모</Label>
              <Input
                value={newRecord.memo}
                onChange={(e) =>
                  setNewRecord((prev) => ({ ...prev, memo: e.target.value }))
                }
                placeholder="메모 (선택)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleAdd}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
