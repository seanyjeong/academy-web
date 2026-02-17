"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { studentsAPI } from "@/lib/api/students";
import { paymentsAPI } from "@/lib/api/payments";
import { formatKRW, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Search, CreditCard, History } from "lucide-react";

// --- Types ---

interface StudentOption {
  id: number;
  name: string;
  status: string;
}

interface RestCreditSummary {
  student_id: number;
  year: string;
  max_credits: number;
  used: number;
  remaining: number;
}

interface CreditEntry {
  credit_id: number;
  year: string;
  amount: string;
  reason: string;
}

interface DiscountPayment {
  id: number;
  student_id: number;
  student_name?: string;
  year_month: string;
  discount_amount: number;
  final_amount: number;
  paid_amount: number;
}

// --- Component ---

export default function CreditsPage() {
  // Tab: "rest" (rest credit management) | "discount" (discount payment history)
  const [tab, setTab] = useState<"rest" | "discount">("rest");

  // Student search & selection
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  // Rest credit data for selected student
  const [restSummary, setRestSummary] = useState<RestCreditSummary | null>(null);
  const [creditEntries, setCreditEntries] = useState<CreditEntry[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Add credit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ credits: 1, reason: "" });
  const [addType, setAddType] = useState<"rest" | "manual">("rest");
  const [submitting, setSubmitting] = useState(false);

  // Discount payments tab
  const [discountPayments, setDiscountPayments] = useState<DiscountPayment[]>([]);
  const [loadingDiscount, setLoadingDiscount] = useState(true);

  // Load student list
  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await studentsAPI.list({ limit: 500 });
      const list = Array.isArray(data) ? data : data.items ?? [];
      setStudents(
        list.map((s: { id: number; name: string; status: string }) => ({
          id: s.id,
          name: s.name,
          status: s.status,
        }))
      );
    } catch {
      setStudents([]);
    }
  }, []);

  // Load discount payments
  const fetchDiscountPayments = useCallback(async () => {
    setLoadingDiscount(true);
    try {
      const { data } = await paymentsAPI.credits();
      setDiscountPayments(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setDiscountPayments([]);
    } finally {
      setLoadingDiscount(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (tab === "discount") {
      fetchDiscountPayments();
    }
  }, [tab, fetchDiscountPayments]);

  // Load credits for selected student
  const loadStudentCredits = useCallback(async (studentId: number) => {
    setLoadingCredits(true);
    try {
      const [summaryRes, entriesRes] = await Promise.all([
        studentsAPI.restCredits(studentId),
        studentsAPI.credits(studentId),
      ]);
      setRestSummary(summaryRes.data);
      setCreditEntries(entriesRes.data?.credits ?? []);
    } catch {
      setRestSummary(null);
      setCreditEntries([]);
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentCredits(selectedStudent.id);
    } else {
      setRestSummary(null);
      setCreditEntries([]);
    }
  }, [selectedStudent, loadStudentCredits]);

  // Filter students by search
  const filteredStudents = searchQuery.trim()
    ? students.filter((s) => s.name.includes(searchQuery.trim()))
    : [];

  // Add credit handler
  const handleAddCredit = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      if (addType === "rest") {
        await studentsAPI.addCredits(selectedStudent.id, {
          credits: addForm.credits,
          reason: addForm.reason || undefined,
        });
      } else {
        await studentsAPI.manualCredit(selectedStudent.id, {
          days: addForm.credits,
          reason: addForm.reason || "수동 크레딧 추가",
        });
      }
      toast.success("크레딧이 추가되었습니다");
      setShowAddModal(false);
      setAddForm({ credits: 1, reason: "" });
      loadStudentCredits(selectedStudent.id);
    } catch {
      toast.error("크레딧 추가에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete credit handler
  const handleDeleteCredit = async (creditId: number) => {
    if (!selectedStudent) return;
    if (!confirm("이 크레딧 항목을 삭제하시겠습니까?")) return;
    try {
      await studentsAPI.deleteCredit(selectedStudent.id, creditId);
      toast.success("크레딧이 삭제되었습니다");
      loadStudentCredits(selectedStudent.id);
    } catch {
      toast.error("크레딧 삭제에 실패했습니다");
    }
  };

  // Apply credit handler
  const handleApplyCredit = async (creditId: number) => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.applyCredit(selectedStudent.id, creditId);
      toast.success("크레딧이 적용되었습니다");
      loadStudentCredits(selectedStudent.id);
    } catch {
      toast.error("크레딧 적용에 실패했습니다");
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    active: "재원",
    paused: "휴원",
    withdrawn: "퇴원",
    graduated: "졸업",
    trial: "체험",
    pending: "미등록",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">크레딧 관리</h1>
          <p className="text-sm text-slate-500">
            학생별 휴원 크레딧 관리 및 할인 수납 내역
          </p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "rest" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("rest")}
        >
          <CreditCard className="mr-1.5 h-4 w-4" />
          휴원 크레딧
        </Button>
        <Button
          variant={tab === "discount" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("discount")}
        >
          <History className="mr-1.5 h-4 w-4" />
          할인 수납 내역
        </Button>
      </div>

      {tab === "rest" ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Student Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">학생 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="학생 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searchQuery.trim() && (
                <div className="mt-2 max-h-[300px] overflow-y-auto rounded-md border">
                  {filteredStudents.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-slate-400">
                      검색 결과 없음
                    </p>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          selectedStudent?.id === s.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          setSelectedStudent(s);
                          setSearchQuery("");
                        }}
                      >
                        <span className="font-medium">{s.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedStudent && (
                <div className="mt-3 rounded-md border bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {STATUS_LABELS[selectedStudent.status] ?? selectedStudent.status}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(null)}
                    >
                      변경
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Details */}
          <div className="space-y-4">
            {!selectedStudent ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">
                    좌측에서 학생을 검색하여 선택해주세요
                  </p>
                </CardContent>
              </Card>
            ) : loadingCredits ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Rest Credit Summary */}
                {restSummary && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-base">
                        {restSummary.year}년 휴원 크레딧
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => {
                          setAddType("rest");
                          setAddForm({ credits: 1, reason: "" });
                          setShowAddModal(true);
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        크레딧 추가
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">
                            {restSummary.max_credits}
                          </p>
                          <p className="text-xs text-slate-500">연간 최대</p>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                          <p className="text-2xl font-bold text-amber-600">
                            {restSummary.used}
                          </p>
                          <p className="text-xs text-slate-500">사용</p>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {restSummary.remaining}
                          </p>
                          <p className="text-xs text-slate-500">잔여</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Credit History */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">크레딧 내역</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddType("manual");
                        setAddForm({ credits: 1, reason: "" });
                        setShowAddModal(true);
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      수동 크레딧
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {creditEntries.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">
                        크레딧 내역이 없습니다
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>연도</TableHead>
                            <TableHead>수량</TableHead>
                            <TableHead>사유</TableHead>
                            <TableHead className="text-right">작업</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditEntries.map((entry) => (
                            <TableRow key={entry.credit_id}>
                              <TableCell>{entry.year}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-600"
                                >
                                  {entry.amount}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {entry.reason || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => handleApplyCredit(entry.credit_id)}
                                  >
                                    적용
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteCredit(entry.credit_id)}
                                  >
                                    삭제
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Discount Payments Tab */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">할인 적용 수납 내역</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDiscount ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : discountPayments.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                할인 적용된 수납 내역이 없습니다
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생명</TableHead>
                    <TableHead>월</TableHead>
                    <TableHead className="text-right">할인액</TableHead>
                    <TableHead className="text-right">최종 금액</TableHead>
                    <TableHead className="text-right">납부액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.student_name ?? `학생 #${p.student_id}`}
                      </TableCell>
                      <TableCell>{p.year_month}</TableCell>
                      <TableCell className="text-right text-amber-600">
                        -{formatKRW(p.discount_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(p.final_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(p.paid_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Credit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addType === "rest" ? "휴원 크레딧 추가" : "수동 크레딧 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>
                {addType === "rest" ? "크레딧 수" : "일수"}
              </Label>
              <Input
                type="number"
                min={1}
                value={addForm.credits}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, credits: Number(e.target.value) || 1 }))
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>사유</Label>
              <Input
                value={addForm.reason}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder={
                  addType === "rest"
                    ? "예: 장기 휴원 보상"
                    : "예: 보충수업 미진행 보상"
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button onClick={handleAddCredit} disabled={submitting}>
              {submitting ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
