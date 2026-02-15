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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Building2, Mail } from "lucide-react";
import Link from "next/link";

const MODULE_OPTIONS = [
  { key: "training", label: "훈련 모듈", description: "측정기록, 훈련계획, 훈련일지 등" },
  { key: "consultation", label: "상담 모듈", description: "상담관리, 공개 폼, 캘린더" },
  { key: "finance", label: "재무 모듈", description: "수납, 급여, 수입/지출 관리" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    modules: [] as string[],
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
        <p className="text-sm text-slate-500">학원 정보 및 모듈을 설정합니다</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>학원 정보</CardTitle>
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
