"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { Building2, Layers, CheckCircle2 } from "lucide-react";

const MODULES = [
  { key: "training", label: "훈련", description: "측정기록, 훈련계획, 훈련일지, 월간테스트" },
  { key: "consultation", label: "상담", description: "상담관리, 공개 폼, 캘린더" },
  { key: "finance", label: "재무", description: "수납, 급여, 수입/지출 관리" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [academy, setAcademy] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [selectedModules, setSelectedModules] = useState<string[]>(["training"]);
  const [season, setSeason] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleNext = () => {
    if (step === 1 && !academy.name) {
      toast.error("학원명을 입력하세요");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await settingsAPI.update({
        ...academy,
        modules: selectedModules,
        first_season: season.name ? season : undefined,
      });
      toast.success("설정이 완료되었습니다");
      router.push("/dashboard");
    } catch {
      toast.error("설정 저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "학원 정보", icon: Building2 },
    { num: 2, label: "모듈 선택", icon: Layers },
    { num: 3, label: "첫 시즌", icon: CheckCircle2 },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
          A
        </div>
        <span className="text-2xl font-bold text-slate-900">Academy</span>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-slate-200" />}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s.num
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {s.num}
            </div>
            <span
              className={`text-sm ${
                step >= s.num ? "font-medium text-slate-900" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>학원 정보</CardTitle>
              <CardDescription>기본 학원 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">학원명 *</Label>
                <Input
                  id="name"
                  value={academy.name}
                  onChange={(e) => setAcademy((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={academy.address}
                  onChange={(e) => setAcademy((p) => ({ ...p, address: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={academy.phone}
                  onChange={(e) => setAcademy((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleNext}>다음</Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>모듈 선택</CardTitle>
              <CardDescription>사용할 기능을 선택하세요 (나중에 변경 가능)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MODULES.map((mod) => (
                <button
                  key={mod.key}
                  onClick={() => toggleModule(mod.key)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedModules.includes(mod.key)
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{mod.label}</p>
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selectedModules.includes(mod.key)
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedModules.includes(mod.key) && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                </button>
              ))}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  이전
                </Button>
                <Button onClick={handleNext}>다음</Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>첫 시즌 생성</CardTitle>
              <CardDescription>
                학원의 첫 시즌을 만들어보세요 (건너뛸 수 있습니다)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seasonName">시즌명</Label>
                <Input
                  id="seasonName"
                  value={season.name}
                  onChange={(e) => setSeason((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 2026년 봄학기"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시작일</Label>
                  <Input
                    type="date"
                    value={season.start_date}
                    onChange={(e) => setSeason((p) => ({ ...p, start_date: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>종료일</Label>
                  <Input
                    type="date"
                    value={season.end_date}
                    onChange={(e) => setSeason((p) => ({ ...p, end_date: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  이전
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSeason({ name: "", start_date: "", end_date: "" });
                      handleComplete();
                    }}
                    disabled={loading}
                  >
                    건너뛰기
                  </Button>
                  <Button onClick={handleComplete} disabled={loading}>
                    {loading ? "설정 중..." : "완료"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
