"use client";

import { useState } from "react";
import Link from "next/link";
import { authAPI } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("이메일을 입력하세요");
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("이메일 발송에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          로그인으로 돌아가기
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">메일을 확인하세요</h2>
            <p className="text-sm text-slate-500">
              <strong>{email}</strong>으로 비밀번호 재설정 링크를 보냈습니다.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              메일이 오지 않았다면 스팸함을 확인하거나 다시 시도하세요.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setSent(false)}
            >
              다시 보내기
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">비밀번호 찾기</h2>
              <p className="mt-1 text-sm text-slate-500">
                가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다
              </p>
            </div>

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@academy.com"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "발송 중..." : "재설정 링크 보내기"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
