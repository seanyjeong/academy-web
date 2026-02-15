"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Calendar, Users, UserPlus } from "lucide-react";
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
import { seasonsAPI } from "@/lib/api/seasons";
import { toast } from "sonner";

interface SeasonDetail {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_active?: boolean;
  student_count?: number;
  students?: { id: number; name: string; status: string; enrolled_at?: string }[];
  created_at: string;
}

export default function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSeason = useCallback(async () => {
    try {
      const { data } = await seasonsAPI.get(Number(id));
      setSeason(data);
    } catch {
      toast.error("시즌 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSeason();
  }, [fetchSeason]);

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await seasonsAPI.delete(Number(id));
      toast.success("시즌이 삭제되었습니다");
      router.push("/seasons");
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

  if (!season) {
    return (
      <p className="py-20 text-center text-sm text-slate-400">
        시즌 정보를 찾을 수 없습니다
      </p>
    );
  }

  const now = new Date();
  const start = new Date(season.start_date);
  const end = new Date(season.end_date);
  const isActive = season.is_active ?? (now >= start && now <= end);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">시즌 상세</h1>
          <p className="text-sm text-slate-500">시즌 정보를 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/seasons/${id}/enroll`}>
              <UserPlus className="h-4 w-4" />
              학생 등록
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/seasons/${id}/edit`}>
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
            <CardTitle>시즌 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">시즌명</dt>
                <dd className="font-medium">{season.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">상태</dt>
                <dd>
                  <Badge
                    variant="secondary"
                    className={
                      isActive
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }
                  >
                    {isActive ? "진행중" : "종료"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">기간</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {new Date(season.start_date).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(season.end_date).toLocaleDateString("ko-KR")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">등록 학생수</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <Users className="h-4 w-4 text-slate-400" />
                  {season.student_count ?? season.students?.length ?? 0}명
                </dd>
              </div>
              {season.description && (
                <div className="col-span-2">
                  <dt className="text-slate-500">설명</dt>
                  <dd className="font-medium">{season.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {season.students && season.students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>등록 학생 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {season.students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          href={`/students/${s.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {s.enrolled_at
                          ? new Date(s.enrolled_at).toLocaleDateString("ko-KR")
                          : "-"}
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
