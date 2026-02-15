"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Users, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { schedulesAPI } from "@/lib/api/schedules";

interface Schedule {
  id: number;
  name: string;
  time_slot: string;
  day_of_week: string;
  start_time?: string;
  end_time?: string;
  instructor_name?: string;
  student_count?: number;
  created_at: string;
}

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

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    time_slot: "morning",
    day_of_week: "mon",
    start_time: "",
    end_time: "",
  });

  async function fetchSchedules() {
    setLoading(true);
    try {
      const { data } = await schedulesAPI.list();
      setSchedules(data.items ?? data ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function handleCreate() {
    try {
      await schedulesAPI.create(form);
      toast.success("수업이 등록되었습니다");
      setCreateOpen(false);
      setForm({
        name: "",
        time_slot: "morning",
        day_of_week: "mon",
        start_time: "",
        end_time: "",
      });
      fetchSchedules();
    } catch {
      toast.error("수업 등록에 실패했습니다");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">수업일정</h1>
          <p className="text-sm text-slate-500">수업 일정을 관리합니다</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              수업 등록
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>수업 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>수업 이름</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="예: 초등 오전반"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시간대</Label>
                  <Select
                    value={form.time_slot}
                    onValueChange={(v) =>
                      setForm({ ...form, time_slot: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">오전</SelectItem>
                      <SelectItem value="afternoon">오후</SelectItem>
                      <SelectItem value="evening">저녁</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>요일</Label>
                  <Select
                    value={form.day_of_week}
                    onValueChange={(v) =>
                      setForm({ ...form, day_of_week: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DAY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}요일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={!form.name}>
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            등록된 수업이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => (
            <Card key={s.id} className="py-4 transition-shadow hover:shadow-md">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <Badge variant="secondary">
                    {TIME_SLOT_LABELS[s.time_slot] ?? s.time_slot}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {DAY_LABELS[s.day_of_week] ?? s.day_of_week}요일
                      {s.start_time && s.end_time
                        ? ` ${s.start_time} - ${s.end_time}`
                        : ""}
                    </span>
                  </div>
                  {s.instructor_name && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{s.instructor_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{s.student_count ?? 0}명</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/schedules/${s.id}/attendance`}>
                      <CalendarCheck className="h-4 w-4" />
                      출결 체크
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
