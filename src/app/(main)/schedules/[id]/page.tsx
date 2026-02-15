"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Clock, Users, CalendarCheck } from "lucide-react";
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
import { schedulesAPI } from "@/lib/api/schedules";
import { toast } from "sonner";

const DAY_LABELS: Record<string, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
};

interface ScheduleDetail {
  id: number;
  name: string;
  time_slot: string;
  day_of_week?: string;
  days?: string[];
  start_time?: string;
  end_time?: string;
  instructor_name?: string;
  instructor_id?: number;
  capacity?: number;
  student_count?: number;
  memo?: string;
  students?: { id: number; name: string; status: string }[];
  created_at: string;
}

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    try {
      const { data } = await schedulesAPI.get(Number(id));
      setSchedule(data);
    } catch {
      toast.error("수업 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await schedulesAPI.delete(Number(id));
      toast.success("수업이 삭제되었습니다");
      router.push("/schedules");
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

  if (!schedule) {
    return (
      <p className="py-20 text-center text-sm text-slate-400">
        수업 정보를 찾을 수 없습니다
      </p>
    );
  }

  const daysDisplay = schedule.days
    ? schedule.days.map((d) => DAY_LABELS[d] ?? d).join(", ")
    : schedule.day_of_week
      ? (DAY_LABELS[schedule.day_of_week] ?? schedule.day_of_week)
      : "-";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수업 상세</h1>
          <p className="text-sm text-slate-500">수업 정보를 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/schedules/${id}/attendance`}>
              <CalendarCheck className="h-4 w-4" />
              출결 체크
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/schedules/${id}/edit`}>
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
            <CardTitle>수업 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">수업명</dt>
                <dd className="font-medium">{schedule.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">시간대</dt>
                <dd>
                  <Badge variant="secondary">
                    {TIME_SLOT_LABELS[schedule.time_slot] ?? schedule.time_slot}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">요일</dt>
                <dd className="font-medium">{daysDisplay}</dd>
              </div>
              <div>
                <dt className="text-slate-500">시간</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {schedule.start_time && schedule.end_time
                    ? `${schedule.start_time} - ${schedule.end_time}`
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">강사</dt>
                <dd className="font-medium">
                  {schedule.instructor_name ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">정원</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <Users className="h-4 w-4 text-slate-400" />
                  {schedule.student_count ?? 0}
                  {schedule.capacity ? ` / ${schedule.capacity}명` : "명"}
                </dd>
              </div>
              {schedule.memo && (
                <div className="col-span-2">
                  <dt className="text-slate-500">메모</dt>
                  <dd className="font-medium">{schedule.memo}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {schedule.students && schedule.students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>수강생 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.students.map((s) => (
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
