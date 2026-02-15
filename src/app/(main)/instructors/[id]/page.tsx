"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { instructorsAPI } from "@/lib/api/instructors";
import { toast } from "sonner";

interface InstructorDetail {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  experience?: string;
  memo?: string;
  is_active?: boolean;
  schedules?: { id: number; name: string; time_slot: string; student_count?: number }[];
  created_at: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
};

export default function InstructorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInstructor = useCallback(async () => {
    try {
      const { data } = await instructorsAPI.get(Number(id));
      setInstructor(data);
    } catch {
      toast.error("강사 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInstructor();
  }, [fetchInstructor]);

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await instructorsAPI.delete(Number(id));
      toast.success("강사가 삭제되었습니다");
      router.push("/instructors");
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!instructor) {
    return (
      <p className="py-20 text-center text-sm text-slate-400">
        강사 정보를 찾을 수 없습니다
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">강사 상세</h1>
          <p className="text-sm text-slate-500">강사 정보를 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/instructors/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              수정
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">이름</dt>
                <dd className="font-medium">{instructor.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">상태</dt>
                <dd>
                  <Badge
                    variant="secondary"
                    className={
                      instructor.is_active !== false
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }
                  >
                    {instructor.is_active !== false ? "활동중" : "비활동"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">연락처</dt>
                <dd className="font-medium">
                  {instructor.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {instructor.phone}
                    </span>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">이메일</dt>
                <dd className="font-medium">
                  {instructor.email ? (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {instructor.email}
                    </span>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">전공</dt>
                <dd className="font-medium">
                  {instructor.specialty ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">경력</dt>
                <dd className="font-medium">
                  {instructor.experience ?? "-"}
                </dd>
              </div>
              {instructor.memo && (
                <div className="col-span-2">
                  <dt className="text-slate-500">메모</dt>
                  <dd className="font-medium">{instructor.memo}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {instructor.schedules && instructor.schedules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>담당 수업 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>수업명</TableHead>
                    <TableHead>시간대</TableHead>
                    <TableHead>수강생</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructor.schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          href={`/schedules/${s.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {TIME_SLOT_LABELS[s.time_slot] ?? s.time_slot}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {s.student_count ?? 0}명
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
