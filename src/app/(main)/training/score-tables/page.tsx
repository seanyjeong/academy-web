"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { scoreTablesAPI, recordTypesAPI } from "@/lib/api/training";

interface RecordType {
  id: number;
  name: string;
  unit?: string;
  direction?: string;
  is_active?: boolean;
}

interface ScoreRange {
  min: number;
  max: number;
  score: number;
}

interface ScoreTable {
  id: number;
  record_type_id: number;
  record_type_name?: string;
  gender?: string;
  age_group?: string;
  ranges: ScoreRange[];
}

const GENDER_OPTIONS = [
  { value: "all", label: "공통" },
  { value: "male", label: "남" },
  { value: "female", label: "여" },
];

const AGE_GROUPS = [
  { value: "all", label: "전체" },
  { value: "middle", label: "중학생" },
  { value: "high", label: "고등학생" },
  { value: "adult", label: "성인" },
];

export default function ScoreTablesPage() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [scoreTables, setScoreTables] = useState<ScoreTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    record_type_id: 0,
    gender: "all",
    age_group: "all",
  });
  const [ranges, setRanges] = useState<ScoreRange[]>([
    { min: 0, max: 10, score: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRanges, setEditRanges] = useState<ScoreRange[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, tablesRes] = await Promise.all([
        recordTypesAPI.list(),
        scoreTablesAPI.list(),
      ]);
      const types = typesRes.data?.items ?? typesRes.data ?? [];
      setRecordTypes(types);
      const tables = tablesRes.data?.items ?? tablesRes.data ?? [];
      setScoreTables(tables);
    } catch {
      toast.error("데이터를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTables = selectedTypeId
    ? scoreTables.filter((t) => t.record_type_id === selectedTypeId)
    : scoreTables;

  const getTypeName = (typeId: number) =>
    recordTypes.find((rt) => rt.id === typeId)?.name ?? `종목 #${typeId}`;

  const getTypeUnit = (typeId: number) =>
    recordTypes.find((rt) => rt.id === typeId)?.unit ?? "";

  const handleCreate = async () => {
    if (!createForm.record_type_id) {
      toast.error("종목을 선택해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await scoreTablesAPI.create({
        record_type_id: createForm.record_type_id,
        gender: createForm.gender === "all" ? undefined : createForm.gender,
        age_group: createForm.age_group === "all" ? undefined : createForm.age_group,
        ranges,
      });
      toast.success("배점표가 생성되었습니다");
      setCreateOpen(false);
      setRanges([{ min: 0, max: 10, score: 1 }]);
      fetchData();
    } catch {
      toast.error("생성에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await scoreTablesAPI.update(editingId, { ranges: editRanges });
      toast.success("배점표가 수정되었습니다");
      setEditingId(null);
      fetchData();
    } catch {
      toast.error("수정에 실패했습니다");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 배점표를 삭제하시겠습니까?")) return;
    try {
      await scoreTablesAPI.delete(id);
      toast.success("삭제되었습니다");
      fetchData();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  const addRange = (target: "create" | "edit") => {
    const newRange = { min: 0, max: 0, score: 0 };
    if (target === "create") {
      const last = ranges[ranges.length - 1];
      if (last) newRange.min = last.max;
      newRange.max = newRange.min + 10;
      newRange.score = last ? last.score + 1 : 1;
      setRanges([...ranges, newRange]);
    } else {
      const last = editRanges[editRanges.length - 1];
      if (last) newRange.min = last.max;
      newRange.max = newRange.min + 10;
      newRange.score = last ? last.score + 1 : 1;
      setEditRanges([...editRanges, newRange]);
    }
  };

  const updateRange = (
    target: "create" | "edit",
    idx: number,
    field: keyof ScoreRange,
    value: number
  ) => {
    const setter = target === "create" ? setRanges : setEditRanges;
    setter((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeRange = (target: "create" | "edit", idx: number) => {
    const setter = target === "create" ? setRanges : setEditRanges;
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  function RangeEditor({
    target,
    data,
    unit,
  }: {
    target: "create" | "edit";
    data: ScoreRange[];
    unit: string;
  }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>배점 범위</Label>
          <Button variant="outline" size="sm" onClick={() => addRange(target)}>
            <Plus className="mr-1 h-3 w-3" />
            범위 추가
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>최소{unit ? ` (${unit})` : ""}</TableHead>
                <TableHead>최대{unit ? ` (${unit})` : ""}</TableHead>
                <TableHead>점수</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.min}
                      onChange={(e) =>
                        updateRange(target, i, "min", Number(e.target.value))
                      }
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.max}
                      onChange={(e) =>
                        updateRange(target, i, "max", Number(e.target.value))
                      }
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.score}
                      onChange={(e) =>
                        updateRange(target, i, "score", Number(e.target.value))
                      }
                      className="h-8 w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRange(target, i)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center text-sm text-slate-400">
                    범위를 추가하세요
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">배점표 관리</h1>
          <p className="text-sm text-slate-500">종목별 기록 점수 변환 범위를 설정합니다</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          배점표 추가
        </Button>
      </div>

      {/* Filter by record type */}
      <div className="mb-4">
        <Select
          value={selectedTypeId ? String(selectedTypeId) : "all"}
          onValueChange={(v) => setSelectedTypeId(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="종목 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 종목</SelectItem>
            {recordTypes.map((rt) => (
              <SelectItem key={rt.id} value={String(rt.id)}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredTables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-400">배점표가 없습니다</p>
            <Button variant="outline" className="mt-3" onClick={() => setCreateOpen(true)}>
              첫 배점표 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTables.map((table) => {
            const isEditing = editingId === table.id;
            const displayRanges = isEditing ? editRanges : table.ranges ?? [];
            const unit = getTypeUnit(table.record_type_id);

            return (
              <Card key={table.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {table.record_type_name ?? getTypeName(table.record_type_id)}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {table.gender && table.gender !== "all" && (
                        <Badge variant="secondary">
                          {table.gender === "male" ? "남" : "여"}
                        </Badge>
                      )}
                      {table.age_group && table.age_group !== "all" && (
                        <Badge variant="outline">{table.age_group}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-3">
                      <RangeEditor target="edit" data={editRanges} unit={unit} />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          취소
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="mr-1 h-3.5 w-3.5" />
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>범위{unit ? ` (${unit})` : ""}</TableHead>
                            <TableHead className="text-right">점수</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayRanges.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-sm text-slate-400">
                                범위 없음
                              </TableCell>
                            </TableRow>
                          ) : (
                            displayRanges.map((r, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm">
                                  {r.min} ~ {r.max}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">
                                  {r.score}점
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(table.id);
                            setEditRanges([...(table.ranges ?? [])]);
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(table.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>배점표 추가</DialogTitle>
            <DialogDescription>종목별 기록 범위와 점수를 설정합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">종목</Label>
              <Select
                value={createForm.record_type_id ? String(createForm.record_type_id) : ""}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, record_type_id: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="종목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((rt) => (
                    <SelectItem key={rt.id} value={String(rt.id)}>
                      {rt.name} {rt.unit ? `(${rt.unit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">성별</Label>
                <Select
                  value={createForm.gender}
                  onValueChange={(v) => setCreateForm({ ...createForm, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">연령대</Label>
                <Select
                  value={createForm.age_group}
                  onValueChange={(v) => setCreateForm({ ...createForm, age_group: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <RangeEditor
              target="create"
              data={ranges}
              unit={
                createForm.record_type_id
                  ? getTypeUnit(createForm.record_type_id)
                  : ""
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={submitting || ranges.length === 0}>
              {submitting ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
