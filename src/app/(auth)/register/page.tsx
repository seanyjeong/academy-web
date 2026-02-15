"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirm: "",
    phone: "",
    academy_name: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.academy_name) {
      toast.error("필수 항목을 입력하세요");
      return;
    }
    if (form.password !== form.password_confirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    if (form.password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }
    if (!agreed) {
      toast.error("이용약관에 동의해주세요");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        academy_name: form.academy_name,
      });
      if (data.token) {
        localStorage.setItem("token", data.token);
        if (data.user?.academy_id) {
          localStorage.setItem("activeAcademyId", String(data.user.academy_id));
        }
      }
      router.push("/onboarding");
    } catch (err: any) {
      const msg = err.response?.data?.message || "회원가입에 실패했습니다";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-blue-600 p-12 text-white lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold">
            A
          </div>
          <span className="text-2xl font-bold">Academy</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold leading-tight">
          학원 관리의 시작,
          <br />
          지금 가입하세요
        </h1>
        <p className="text-lg text-blue-100">
          무료로 시작하고 필요한 모듈만 활성화하세요
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">회원가입</h2>
            <p className="mt-1 text-sm text-slate-500">
              새 계정을 만들고 학원을 등록하세요
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@academy.com"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호 *</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="password_confirm">비밀번호 확인 *</Label>
              <Input
                id="password_confirm"
                type="password"
                value={form.password_confirm}
                onChange={(e) => update("password_confirm", e.target.value)}
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="010-0000-0000"
                className="mt-1.5 h-11"
              />
            </div>

            <div>
              <Label htmlFor="academy_name">학원명 *</Label>
              <Input
                id="academy_name"
                value={form.academy_name}
                onChange={(e) => update("academy_name", e.target.value)}
                className="mt-1.5 h-11"
                required
              />
            </div>

            <label className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span className="text-sm text-slate-500">
                <span className="text-blue-600 underline cursor-pointer">이용약관</span> 및{" "}
                <span className="text-blue-600 underline cursor-pointer">개인정보처리방침</span>에
                동의합니다
              </span>
            </label>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </Button>

          <p className="text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
