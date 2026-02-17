"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Video,
  MapPin,
  ClipboardCheck,
  UserPlus,
  Save,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { consultationsAPI } from "@/lib/api/consultations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";

interface Consultation {
  id: number;
  name: string;
  student_name?: string;
  phone?: string;
  consultation_type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  consultation_date?: string;
  status: string;
  counselor?: string;
  memo?: string;
  notes?: string;
  result?: string;
  next_date?: string;
  linked_student_id?: number;
  linked_student_name?: string;
  converted_at?: string;
  created_at: string;
}

interface CalendarEntry {
  date: string;
  consultations: Consultation[];
}

interface EnrolledEntry {
  id: number;
  name: string;
  converted_at?: string;
  linked_student_id?: number;
  linked_student_name?: string;
}

interface ConsultationSettings {
  slug?: string;
  time_slots?: string[];
  available_days?: number[];
  auto_reply?: boolean;
  [key: string]: unknown;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-slate-100 text-slate-600" },
  scheduled: { label: "예약", color: "bg-blue-50 text-blue-600" },
  in_progress: { label: "진행중", color: "bg-amber-50 text-amber-600" },
  completed: { label: "완료", color: "bg-green-50 text-green-600" },
  cancelled: { label: "취소", color: "bg-red-50 text-red-600" },
};

const CONSULTATION_TYPES: Record<string, { label: string; icon: typeof Phone }> = {
  visit: { label: "방문상담", icon: MapPin },
  phone: { label: "전화상담", icon: Phone },
  online: { label: "온라인상담", icon: Video },
};

function getCalendarDays(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

const INITIAL_FORM = {
  name: "",
  phone: "",
  consultation_type: "visit",
  scheduled_date: "",
  scheduled_time: "",
  notes: "",
};

export default function ConsultationsPage() {
  const router = useRouter();

  // List tab state
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  // Conduct dialog state
  const [conductTarget, setConductTarget] = useState<Consultation | null>(null);
  const [conductForm, setConductForm] = useState({
    result: "",
    notes: "",
    next_date: "",
  });

  // Convert dialog state
  const [convertTarget, setConvertTarget] = useState<Consultation | null>(null);
  const [convertMode, setConvertMode] = useState<"new" | "link">("new");
  const [convertAdmission, setConvertAdmission] = useState("regular");
  const [linkStudentId, setLinkStudentId] = useState("");

  // Calendar tab state
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarData, setCalendarData] = useState<Record<string, Consultation[]>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Enrolled tab state
  const [enrolledList, setEnrolledList] = useState<EnrolledEntry[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);

  // Settings tab state
  const [settings, setSettings] = useState<ConsultationSettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState<ConsultationSettings>({});

  // Active tab
  const [activeTab, setActiveTab] = useState("list");

  // Fetch consultations list
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const { data } = await consultationsAPI.list(params);
      setConsultations(Array.isArray(data) ? data : data.items ?? data.data ?? []);
    } catch {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch calendar data
  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const ym = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`;
      const { data } = await consultationsAPI.calendar({ year_month: ym });
      const entries: CalendarEntry[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];
      const map: Record<string, Consultation[]> = {};
      entries.forEach((e) => {
        map[e.date] = e.consultations ?? [];
      });
      // Also handle flat consultation array format
      if (entries.length > 0 && !entries[0].consultations) {
        const flat = entries as unknown as Consultation[];
        flat.forEach((c) => {
          const d = c.scheduled_date ?? c.consultation_date ?? c.created_at?.slice(0, 10);
          if (d) {
            if (!map[d]) map[d] = [];
            map[d].push(c);
          }
        });
      }
      setCalendarData(map);
    } catch {
      setCalendarData({});
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    if (activeTab === "calendar") fetchCalendar();
  }, [activeTab, fetchCalendar]);

  // Fetch enrolled data
  const fetchEnrolled = useCallback(async () => {
    setEnrolledLoading(true);
    try {
      const { data } = await consultationsAPI.enrolled();
      setEnrolledList(Array.isArray(data) ? data : data.items ?? data.data ?? []);
    } catch {
      setEnrolledList([]);
    } finally {
      setEnrolledLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "enrolled") fetchEnrolled();
  }, [activeTab, fetchEnrolled]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const { data } = await consultationsAPI.settings();
      const s = data.data ?? data;
      setSettings(s);
      setSettingsForm({ ...s });
    } catch {
      setSettings({});
      setSettingsForm({});
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "settings") fetchSettings();
  }, [activeTab, fetchSettings]);

  // Create consultation
  async function handleCreate() {
    try {
      await consultationsAPI.create(form);
      toast.success("상담이 등록되었습니다");
      setCreateOpen(false);
      setForm({ ...INITIAL_FORM });
      fetchData();
    } catch {
      toast.error("상담 등록에 실패했습니다");
    }
  }

  // Conduct consultation
  async function handleConduct() {
    if (!conductTarget) return;
    try {
      await consultationsAPI.conduct(conductTarget.id, {
        result: conductForm.result,
        notes: conductForm.notes,
        next_date: conductForm.next_date || undefined,
      });
      toast.success("상담 결과가 저장되었습니다");
      setConductTarget(null);
      setConductForm({ result: "", notes: "", next_date: "" });
      fetchData();
    } catch {
      toast.error("상담 진행에 실패했습니다");
    }
  }

  // Convert to student
  async function handleConvert() {
    if (!convertTarget) return;
    try {
      if (convertMode === "link" && linkStudentId) {
        await consultationsAPI.linkStudent(convertTarget.id, {
          student_id: Number(linkStudentId),
        });
        toast.success("기존 학생과 연결되었습니다");
      } else {
        await consultationsAPI.convert(convertTarget.id, {
          admission_type: convertAdmission,
        });
        toast.success("학생으로 전환되었습니다");
      }
      setConvertTarget(null);
      setConvertMode("new");
      setConvertAdmission("regular");
      setLinkStudentId("");
      fetchData();
      if (convertMode === "new") router.push("/students");
    } catch {
      toast.error("학생 전환에 실패했습니다");
    }
  }

  // Save settings
  async function handleSaveSettings() {
    try {
      await consultationsAPI.updateSettings(settingsForm);
      toast.success("설정이 저장되었습니다");
      fetchSettings();
    } catch {
      toast.error("설정 저장에 실패했습니다");
    }
  }

  // Calendar navigation
  function prevMonth() {
    if (calendarMonth === 1) {
      setCalendarYear((y) => y - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (calendarMonth === 12) {
      setCalendarYear((y) => y + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  const calendarWeeks = getCalendarDays(calendarYear, calendarMonth);
  const dayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">상담 관리</h1>
          <p className="text-sm text-slate-500">
            상담 문의 및 진행 현황을 관리합니다
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              상담 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>상담 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="상담자 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>상담 유형</Label>
                <Select
                  value={form.consultation_type}
                  onValueChange={(v) =>
                    setForm({ ...form, consultation_type: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONSULTATION_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>상담 예정일</Label>
                  <Input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) =>
                      setForm({ ...form, scheduled_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>시간</Label>
                  <Input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) =>
                      setForm({ ...form, scheduled_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="상담 관련 메모"
                  rows={3}
                />
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">상담목록</TabsTrigger>
          <TabsTrigger value="calendar">캘린더</TabsTrigger>
          <TabsTrigger value="enrolled">등록전환</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* ========== List Tab ========== */}
        <TabsContent value="list">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="이름, 연락처 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="scheduled">예약</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>상담일</TableHead>
                  <TableHead>상담유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead className="w-[160px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : consultations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      상담 내역이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  consultations.map((c) => {
                    const statusInfo = STATUS_MAP[c.status] ?? {
                      label: c.status,
                      color: "bg-slate-100 text-slate-500",
                    };
                    const typeInfo = CONSULTATION_TYPES[c.consultation_type ?? ""];
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.student_name || c.name}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {c.phone ?? "-"}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {c.scheduled_date
                            ? formatDate(c.scheduled_date)
                            : c.consultation_date
                              ? formatDate(c.consultation_date)
                              : formatDate(c.created_at)}
                          {c.scheduled_time && (
                            <span className="ml-1 text-slate-400">
                              {c.scheduled_time}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {typeInfo ? (
                            <span className="text-sm text-slate-600">
                              {typeInfo.label}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusInfo.color}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {c.counselor ?? "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(c.status === "pending" ||
                              c.status === "scheduled" ||
                              c.status === "in_progress") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setConductTarget(c);
                                  setConductForm({
                                    result: "",
                                    notes: c.notes ?? "",
                                    next_date: "",
                                  });
                                }}
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                상담진행
                              </Button>
                            )}
                            {c.status === "completed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConvertTarget(c)}
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                학생전환
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ========== Calendar Tab ========== */}
        <TabsContent value="calendar">
          <Card>
            <CardContent className="pt-4">
              {/* Month navigation */}
              <div className="mb-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-base font-semibold text-slate-900">
                  {calendarYear}년 {calendarMonth}월
                </h3>
                <Button variant="ghost" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {calendarLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {dayHeaders.map((d, i) => (
                          <th
                            key={d}
                            className={`border p-2 text-center text-xs font-medium ${
                              i === 0
                                ? "text-red-500"
                                : i === 6
                                  ? "text-blue-500"
                                  : "text-slate-500"
                            }`}
                          >
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calendarWeeks.map((week, wi) => (
                        <tr key={wi}>
                          {week.map((day, di) => {
                            if (day === null)
                              return (
                                <td key={di} className="border p-1" />
                              );
                            const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const entries = calendarData[dateStr] ?? [];
                            const today = new Date();
                            const isToday =
                              today.getFullYear() === calendarYear &&
                              today.getMonth() + 1 === calendarMonth &&
                              today.getDate() === day;
                            return (
                              <td
                                key={di}
                                className={`border p-1 align-top ${isToday ? "bg-blue-50" : ""}`}
                                style={{ minWidth: 80, height: 80 }}
                              >
                                <div
                                  className={`mb-1 text-xs font-medium ${
                                    di === 0
                                      ? "text-red-500"
                                      : di === 6
                                        ? "text-blue-500"
                                        : "text-slate-700"
                                  }`}
                                >
                                  {day}
                                </div>
                                <div className="space-y-0.5">
                                  {entries.slice(0, 3).map((c, ci) => {
                                    const st = STATUS_MAP[c.status];
                                    return (
                                      <div
                                        key={ci}
                                        className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${st?.color ?? "bg-slate-100 text-slate-500"}`}
                                        title={`${c.student_name || c.name} - ${st?.label ?? c.status}`}
                                      >
                                        {c.student_name || c.name}
                                      </div>
                                    );
                                  })}
                                  {entries.length > 3 && (
                                    <div className="text-[10px] text-slate-400">
                                      +{entries.length - 3}건
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Enrolled Tab ========== */}
        <TabsContent value="enrolled">
          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>전환일</TableHead>
                  <TableHead>연결학생</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-12 text-center text-slate-400"
                    >
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : enrolledList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-12 text-center text-slate-400"
                    >
                      전환된 상담 내역이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  enrolledList.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-slate-500">
                        {e.converted_at ? formatDate(e.converted_at) : "-"}
                      </TableCell>
                      <TableCell>
                        {e.linked_student_name ? (
                          <span className="text-blue-600">
                            {e.linked_student_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ========== Settings Tab ========== */}
        <TabsContent value="settings">
          {settingsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-6 pt-4">
                {/* Slug setting */}
                <div className="space-y-2">
                  <Label>상담 신청 링크 (슬러그)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={settingsForm.slug ?? ""}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          slug: e.target.value,
                        })
                      }
                      placeholder="my-academy"
                    />
                    {settingsForm.slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/c/${settingsForm.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success("링크가 복사되었습니다");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        복사
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    공개 상담 신청 폼의 URL에 사용됩니다
                  </p>
                </div>

                {/* Time slot config */}
                <div className="space-y-2">
                  <Label>상담 가능 시간대</Label>
                  <Textarea
                    value={(settingsForm.time_slots ?? []).join(", ")}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        time_slots: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="09:00, 10:00, 11:00, 14:00, 15:00, 16:00"
                    rows={2}
                  />
                  <p className="text-xs text-slate-400">
                    쉼표로 구분하여 입력 (예: 09:00, 10:00, 14:00)
                  </p>
                </div>

                {/* Save */}
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4" />
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ========== Conduct Dialog ========== */}
      <Dialog
        open={!!conductTarget}
        onOpenChange={(open) => !open && setConductTarget(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>상담 진행</DialogTitle>
            <DialogDescription>
              {conductTarget?.student_name || conductTarget?.name}님 상담 결과를
              기록합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>상담 결과</Label>
              <Textarea
                value={conductForm.result}
                onChange={(e) =>
                  setConductForm({ ...conductForm, result: e.target.value })
                }
                placeholder="상담 결과를 입력하세요"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea
                value={conductForm.notes}
                onChange={(e) =>
                  setConductForm({ ...conductForm, notes: e.target.value })
                }
                placeholder="추가 메모"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>다음 상담일 (선택)</Label>
              <Input
                type="date"
                value={conductForm.next_date}
                onChange={(e) =>
                  setConductForm({ ...conductForm, next_date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConductTarget(null)}>
              취소
            </Button>
            <Button onClick={handleConduct} disabled={!conductForm.result}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Convert Dialog ========== */}
      <Dialog
        open={!!convertTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConvertTarget(null);
            setConvertMode("new");
            setConvertAdmission("regular");
            setLinkStudentId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 전환</DialogTitle>
            <DialogDescription>
              {convertTarget?.student_name || convertTarget?.name}님을 학생으로
              등록합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">이름</span>
              <span className="font-medium">
                {convertTarget?.student_name || convertTarget?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">연락처</span>
              <span>{convertTarget?.phone ?? "-"}</span>
            </div>
            {convertTarget?.result && (
              <div className="flex justify-between">
                <span className="text-slate-500">상담 결과</span>
                <span className="max-w-[200px] truncate">
                  {convertTarget.result}
                </span>
              </div>
            )}
          </div>

          {/* Conversion mode */}
          <div className="space-y-3">
            <Label>전환 방법</Label>
            <div className="flex gap-2">
              <Button
                variant={convertMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setConvertMode("new")}
              >
                신규 등록
              </Button>
              <Button
                variant={convertMode === "link" ? "default" : "outline"}
                size="sm"
                onClick={() => setConvertMode("link")}
              >
                기존 학생 연결
              </Button>
            </div>

            {convertMode === "new" && (
              <div className="space-y-2">
                <Label>입학 유형</Label>
                <Select
                  value={convertAdmission}
                  onValueChange={setConvertAdmission}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">정규 등록</SelectItem>
                    <SelectItem value="trial">체험 등록</SelectItem>
                    <SelectItem value="transfer">전학</SelectItem>
                    <SelectItem value="readmission">재등록</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {convertMode === "link" && (
              <div className="space-y-2">
                <Label>학생 ID</Label>
                <Input
                  type="number"
                  placeholder="연결할 학생 ID 입력"
                  value={linkStudentId}
                  onChange={(e) => setLinkStudentId(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertTarget(null)}>
              취소
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertMode === "link" && !linkStudentId}
            >
              <UserPlus className="h-4 w-4" />
              {convertMode === "new" ? "학생으로 등록" : "학생 연결"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
