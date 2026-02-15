"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { assignmentsAPI } from "@/lib/api/training";
import type { Assignment } from "@/lib/types/training";
import { TIME_SLOT_MAP } from "@/lib/types/training";

type TimeSlot = "morning" | "afternoon" | "evening";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TimeSlot>("morning");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await assignmentsAPI.list();
      setAssignments(data as Assignment[]);
    } catch {
      toast.error("반배정을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments.filter((a) => a.time_slot === tab);

  const updateSlot = (studentId: number, newSlot: TimeSlot) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.student_id === studentId ? { ...a, time_slot: newSlot } : a
      )
    );
  };

  const updateGroup = (studentId: number, group: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.student_id === studentId ? { ...a, group } : a
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await assignmentsAPI.bulkUpdate({ assignments });
      toast.success("반배정이 저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">반배정</h1>
          <p className="text-sm text-slate-500">
            학생의 시간대와 그룹을 관리합니다
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save />
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="h-4 w-4 text-indigo-500" />
            학생 반배정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TimeSlot)}
          >
            <TabsList>
              {(Object.entries(TIME_SLOT_MAP) as [TimeSlot, string][]).map(
                ([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                    <Badge variant="secondary" className="ml-1.5 text-xs">
                      {assignments.filter((a) => a.time_slot === key).length}
                    </Badge>
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
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    배정된 학생이 없습니다
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>이름</TableHead>
                        <TableHead>시간대</TableHead>
                        <TableHead>그룹</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((assignment) => (
                        <TableRow key={assignment.student_id}>
                          <TableCell className="font-medium">
                            {assignment.student_name}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={assignment.time_slot}
                              onValueChange={(v) =>
                                updateSlot(
                                  assignment.student_id,
                                  v as TimeSlot
                                )
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  Object.entries(TIME_SLOT_MAP) as [
                                    TimeSlot,
                                    string,
                                  ][]
                                ).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={assignment.group ?? "none"}
                              onValueChange={(v) =>
                                updateGroup(
                                  assignment.student_id,
                                  v === "none" ? "" : v
                                )
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="미배정" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">미배정</SelectItem>
                                <SelectItem value="A">A조</SelectItem>
                                <SelectItem value="B">B조</SelectItem>
                                <SelectItem value="C">C조</SelectItem>
                                <SelectItem value="D">D조</SelectItem>
                              </SelectContent>
                            </Select>
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
    </div>
  );
}
