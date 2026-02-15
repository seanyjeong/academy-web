"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expensesAPI } from "@/lib/api/payments";
import { formatKRW, formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface CategorySummary {
  name: string;
  value: number;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const DEFAULT_CATEGORIES = [
  "임대료",
  "인건비",
  "교재비",
  "시설관리",
  "광고/마케팅",
  "소모품",
  "기타",
];

const expenseSchema = z.object({
  category: z.string().min(1, "카테고리를 선택하세요"),
  description: z.string().min(1, "내용을 입력하세요"),
  amount: z
    .number({ message: "금액을 입력하세요" })
    .min(1, "금액은 1원 이상이어야 합니다"),
  date: z.string().min(1, "날짜를 입력하세요"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getMonthOptions()[0].value);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
    },
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await expensesAPI.list({ month });
      setExpenses(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await expensesAPI.categories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onSubmit = async (formData: ExpenseForm) => {
    setSubmitting(true);
    try {
      await expensesAPI.create(formData as unknown as Record<string, unknown>);
      toast.success("지출이 등록되었습니다");
      setDialogOpen(false);
      reset();
      fetchExpenses();
    } catch {
      toast.error("지출 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await expensesAPI.delete(expenseId);
      toast.success("삭제되었습니다");
      fetchExpenses();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  // Aggregate by category for pie chart
  const categorySummary: CategorySummary[] = expenses.reduce<
    CategorySummary[]
  >((acc, exp) => {
    const found = acc.find((c) => c.name === exp.category);
    if (found) {
      found.value += exp.amount;
    } else {
      acc.push({ name: exp.category, value: exp.amount });
    }
    return acc;
  }, []);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthOptions = getMonthOptions();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">지출관리</h1>
          <p className="text-sm text-slate-500">지출 내역을 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                지출 등록
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>지출 등록</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 py-2"
              >
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select
                    value={watch("category")}
                    onValueChange={(v) =>
                      setValue("category", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">내용</Label>
                  <Input
                    id="description"
                    placeholder="지출 내용"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-amount">금액 (원)</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    placeholder="0"
                    {...register("amount", { valueAsNumber: true })}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-date">날짜</Label>
                  <Input id="exp-date" type="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-sm text-red-500">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "등록 중..." : "등록"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pie chart + total */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>총 지출</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {formatKRW(totalExpense)}
                </p>
                <div className="mt-4 space-y-2">
                  {categorySummary.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="text-slate-600">{cat.name}</span>
                      </div>
                      <span className="font-medium">
                        {formatKRW(cat.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {categorySummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 비율</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySummary}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categorySummary.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            formatKRW(Number(value ?? 0)),
                            "금액",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Expense list */}
          <Card>
            <CardHeader>
              <CardTitle>지출 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  지출 내역이 없습니다
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>내용</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{formatDate(exp.date)}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell>{exp.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatKRW(exp.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(exp.id)}
                          >
                            삭제
                          </Button>
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
