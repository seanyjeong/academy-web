"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { settingsAPI } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Calendar } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    type: "holiday",
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await settingsAPI.events();
      setEvents(Array.isArray(data) ? data : data.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async () => {
    if (!form.title || !form.start_date) {
      toast.error("제목과 시작일은 필수입니다");
      return;
    }
    try {
      await settingsAPI.createEvent(form);
      toast.success("이벤트가 등록되었습니다");
      setDialogOpen(false);
      setForm({ title: "", description: "", start_date: "", end_date: "", type: "holiday" });
      fetchEvents();
    } catch {
      toast.error("등록에 실패했습니다");
    }
  };

  const typeLabels: Record<string, string> = {
    holiday: "휴원",
    event: "행사",
    test: "시험",
    other: "기타",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">학원 이벤트 관리</h1>
            <p className="text-sm text-slate-500">휴원일, 행사 등을 관리합니다</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                이벤트 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>이벤트 추가</DialogTitle>
                <DialogDescription>새 학원 이벤트를 등록합니다</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="eventTitle">제목 *</Label>
                  <Input
                    id="eventTitle"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDesc">설명</Label>
                  <Input
                    id="eventDesc"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>시작일 *</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>종료일</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreate}>등록</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            등록된 이벤트가 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => (
            <Card key={evt.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{evt.title}</p>
                    <p className="text-xs text-slate-500">
                      {evt.start_date}
                      {evt.end_date && evt.end_date !== evt.start_date && ` ~ ${evt.end_date}`}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{typeLabels[evt.type] || evt.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
