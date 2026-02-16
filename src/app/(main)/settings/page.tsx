"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Building2, Mail } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODULE_OPTIONS = [
  { key: "training", label: "훈련 모듈", description: "측정기록, 훈련계획, 훈련일지 등" },
  { key: "consultation", label: "상담 모듈", description: "상담관리, 공개 폼, 캘린더" },
  { key: "finance", label: "재무 모듈", description: "수납, 급여, 수입/지출 관리" },
];

const WEEKLY_KEYS = [
  "weekly_1",
  "weekly_2",
  "weekly_3",
  "weekly_4",
  "weekly_5",
  "weekly_6",
  "weekly_7",
] as const;

const WEEKLY_LABELS = ["주 1회", "주 2회", "주 3회", "주 4회", "주 5회", "주 6회", "주 7회"];

const DEFAULT_TUITION = {
  exam: { weekly_1: 0, weekly_2: 0, weekly_3: 0, weekly_4: 0, weekly_5: 0, weekly_6: 0, weekly_7: 0 },
  adult: { weekly_1: 0, weekly_2: 0, weekly_3: 0, weekly_4: 0, weekly_5: 0, weekly_6: 0, weekly_7: 0 },
};

const DEFAULT_SEASON_FEES = { exam_early: 0, exam_regular: 0, civil_service: 0 };

const DEFAULT_SALARY = { payment_day: 10, month_type: "next" };

const SEASON_FEE_LABELS: { key: keyof typeof DEFAULT_SEASON_FEES; label: string }[] = [
  { key: "exam_early", label: "수시" },
  { key: "exam_regular", label: "정시" },
  { key: "civil_service", label: "공무원" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TuitionCategory = Record<(typeof WEEKLY_KEYS)[number], number>;
type TuitionSettings = { exam: TuitionCategory; adult: TuitionCategory };
type SeasonFees = typeof DEFAULT_SEASON_FEES;
type SalarySettings = typeof DEFAULT_SALARY;

interface SettingsForm {
  name: string;
  phone: string;
  address: string;
  modules: string[];
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
  evening_start: string;
  evening_end: string;
  payment_due_day: number;
  tuition_settings: TuitionSettings;
  season_fees: SeasonFees;
  salary_settings: SalarySettings;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function parseNumber(s: string): number {
  const cleaned = s.replace(/[^0-9]/g, "");
  return cleaned === "" ? 0 : parseInt(cleaned, 10);
}

// ---------------------------------------------------------------------------
// Component: MoneyInput
// ---------------------------------------------------------------------------

function MoneyInput({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  id?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={focused ? (value === 0 ? "" : String(value)) : formatNumber(value)}
        onChange={(e) => onChange(parseNumber(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="pr-8 text-right"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
        원
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    phone: "",
    address: "",
    modules: [],
    morning_start: "06:00",
    morning_end: "12:00",
    afternoon_start: "12:00",
    afternoon_end: "18:00",
    evening_start: "18:00",
    evening_end: "22:00",
    payment_due_day: 10,
    tuition_settings: structuredClone(DEFAULT_TUITION),
    season_fees: { ...DEFAULT_SEASON_FEES },
    salary_settings: { ...DEFAULT_SALARY },
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [newBranch, setNewBranch] = useState({ name: "", address: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, branchesRes] = await Promise.all([
          settingsAPI.get(),
          settingsAPI.branches().catch(() => ({ data: [] })),
        ]);
        const s = settingsRes.data;
        setForm({
          name: s.name || "",
          phone: s.phone || "",
          address: s.address || "",
          modules: s.modules || [],
          morning_start: s.morning_start || "06:00",
          morning_end: s.morning_end || "12:00",
          afternoon_start: s.afternoon_start || "12:00",
          afternoon_end: s.afternoon_end || "18:00",
          evening_start: s.evening_start || "18:00",
          evening_end: s.evening_end || "22:00",
          payment_due_day: s.payment_due_day ?? 10,
          tuition_settings: parseJsonField(s.tuition_settings, structuredClone(DEFAULT_TUITION)),
          season_fees: parseJsonField(s.season_fees, { ...DEFAULT_SEASON_FEES }),
          salary_settings: parseJsonField(s.salary_settings, { ...DEFAULT_SALARY }),
        });
        setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.success("설정이 저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (mod: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(mod)
        ? prev.modules.filter((m) => m !== mod)
        : [...prev.modules, mod],
    }));
  };

  const updateTuition = (
    category: "exam" | "adult",
    key: (typeof WEEKLY_KEYS)[number],
    value: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      tuition_settings: {
        ...prev.tuition_settings,
        [category]: { ...prev.tuition_settings[category], [key]: value },
      },
    }));
  };

  const updateSeasonFee = (key: keyof SeasonFees, value: number) => {
    setForm((prev) => ({
      ...prev,
      season_fees: { ...prev.season_fees, [key]: value },
    }));
  };

  const handleAddBranch = async () => {
    if (!newBranch.name) return;
    try {
      await settingsAPI.addBranch(newBranch);
      toast.success("지점이 추가되었습니다");
      setBranchDialogOpen(false);
      setNewBranch({ name: "", address: "" });
      const { data } = await settingsAPI.branches();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      toast.error("지점 추가에 실패했습니다");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await settingsAPI.inviteOwner({ email: inviteEmail });
      toast.success("초대 메일이 발송되었습니다");
      setInviteDialogOpen(false);
      setInviteEmail("");
    } catch {
      toast.error("초대에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">설정</h1>
        <p className="text-sm text-slate-500">학원 정보 및 운영 설정을 관리합니다</p>
      </div>

      <div className="space-y-6">
        {/* ── Section 1: 학원 기본 정보 ── */}
        <Card>
          <CardHeader>
            <CardTitle>학원 기본 정보</CardTitle>
            <CardDescription>기본 학원 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">학원명</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: 수업 시간대 설정 ── */}
        <Card>
          <CardHeader>
            <CardTitle>수업 시간대 설정</CardTitle>
            <CardDescription>오전/오후/저녁반 시간 범위를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "오전반", startKey: "morning_start", endKey: "morning_end" },
              { label: "오후반", startKey: "afternoon_start", endKey: "afternoon_end" },
              { label: "저녁반", startKey: "evening_start", endKey: "evening_end" },
            ] as const).map(({ label, startKey, endKey }) => (
              <div key={startKey} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-slate-700">{label}</span>
                <Input
                  type="time"
                  value={form[startKey]}
                  onChange={(e) => setForm((p) => ({ ...p, [startKey]: e.target.value }))}
                  className="w-32"
                />
                <span className="text-sm text-slate-400">~</span>
                <Input
                  type="time"
                  value={form[endKey]}
                  onChange={(e) => setForm((p) => ({ ...p, [endKey]: e.target.value }))}
                  className="w-32"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Section 3: 수업료 설정 ── */}
        <Card>
          <CardHeader>
            <CardTitle>수업료 설정</CardTitle>
            <CardDescription>주 수업횟수별 수업료를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment due day */}
            <div className="flex items-center gap-2">
              <Label className="shrink-0">납부일</Label>
              <span className="text-sm text-slate-500">매월</span>
              <Input
                type="number"
                min={1}
                max={28}
                value={form.payment_due_day}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    payment_due_day: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                  }))
                }
                className="w-20 text-center"
              />
              <span className="text-sm text-slate-500">일</span>
            </div>

            <Separator />

            {/* Exam tuition */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-800">입시 수업료</h4>
              <div className="space-y-2">
                {WEEKLY_KEYS.map((key, i) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-slate-600">{WEEKLY_LABELS[i]}</span>
                    <div className="flex-1">
                      <MoneyInput
                        value={form.tuition_settings.exam[key] ?? 0}
                        onChange={(v) => updateTuition("exam", key, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Adult tuition */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-800">일반 수업료</h4>
              <div className="space-y-2">
                {WEEKLY_KEYS.map((key, i) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-slate-600">{WEEKLY_LABELS[i]}</span>
                    <div className="flex-1">
                      <MoneyInput
                        value={form.tuition_settings.adult[key] ?? 0}
                        onChange={(v) => updateTuition("adult", key, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: 시즌 요금 ── */}
        <Card>
          <CardHeader>
            <CardTitle>시즌 요금</CardTitle>
            <CardDescription>시즌 유형별 추가 요금을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SEASON_FEE_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-16 text-sm text-slate-600">{label}</span>
                <div className="flex-1">
                  <MoneyInput
                    value={form.season_fees[key] ?? 0}
                    onChange={(v) => updateSeasonFee(key, v)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Section 5: 급여 설정 ── */}
        <Card>
          <CardHeader>
            <CardTitle>급여 설정</CardTitle>
            <CardDescription>급여 지급일과 정산 기준을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="shrink-0">급여 지급일</Label>
              <span className="text-sm text-slate-500">매월</span>
              <Input
                type="number"
                min={1}
                max={28}
                value={form.salary_settings.payment_day}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    salary_settings: {
                      ...p.salary_settings,
                      payment_day: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                    },
                  }))
                }
                className="w-20 text-center"
              />
              <span className="text-sm text-slate-500">일</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="shrink-0">정산 기준</Label>
              <Select
                value={form.salary_settings.month_type}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    salary_settings: { ...p.salary_settings, month_type: v },
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">이번달</SelectItem>
                  <SelectItem value="next">다음달</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 6: 모듈 설정 (existing) ── */}
        <Card>
          <CardHeader>
            <CardTitle>모듈 설정</CardTitle>
            <CardDescription>사용할 기능 모듈을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MODULE_OPTIONS.map((mod) => (
              <div
                key={mod.key}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{mod.label}</p>
                  <p className="text-xs text-slate-500">{mod.description}</p>
                </div>
                <button
                  onClick={() => toggleModule(mod.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    form.modules.includes(mod.key) ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      form.modules.includes(mod.key) ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Section 7: 멀티 지점 관리 (existing) ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>멀티 지점 관리</CardTitle>
                <CardDescription>여러 지점을 하나의 조직으로 관리합니다</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-1.5 h-4 w-4" />
                      원장 초대
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>원장 초대</DialogTitle>
                      <DialogDescription>
                        이메일로 새 원장을 초대합니다. 초대받은 원장은 로그인 후 조직에 합류할 수 있습니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label htmlFor="inviteEmail">이메일</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="owner@academy.com"
                          className="mt-1.5"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                          취소
                        </Button>
                        <Button onClick={handleInvite}>초대하기</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1.5 h-4 w-4" />
                      지점 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>지점 추가</DialogTitle>
                      <DialogDescription>새 지점 정보를 입력하세요</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label htmlFor="branchName">지점명</Label>
                        <Input
                          id="branchName"
                          value={newBranch.name}
                          onChange={(e) => setNewBranch((p) => ({ ...p, name: e.target.value }))}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="branchAddress">주소</Label>
                        <Input
                          id="branchAddress"
                          value={newBranch.address}
                          onChange={(e) => setNewBranch((p) => ({ ...p, address: e.target.value }))}
                          className="mt-1.5"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>
                          취소
                        </Button>
                        <Button onClick={handleAddBranch}>추가</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {branches.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 지점이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {branches.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        {b.address && <p className="text-xs text-slate-500">{b.address}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Link href="/settings/notifications">
              <Button variant="outline" size="sm">알림 설정</Button>
            </Link>
            <Link href="/settings/events">
              <Button variant="outline" size="sm">이벤트 관리</Button>
            </Link>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "설정 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
