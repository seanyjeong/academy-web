"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { settingsAPI } from "@/lib/api/admin";
import { smsAPI } from "@/lib/api/admin";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Send, Eye, EyeOff } from "lucide-react";

const TEMPLATE_TYPES = [
  { key: "unpaid", label: "미납 알림" },
  { key: "consultation", label: "상담 확인" },
  { key: "trial", label: "체험 알림" },
  { key: "reminder", label: "리마인더" },
];

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("solapi");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<any>({
    solapi: { api_key: "", api_secret: "", sender_number: "" },
    sens: { access_key: "", secret_key: "", service_id: "", sender_number: "" },
    provider: "solapi",
  });
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, templatesRes] = await Promise.all([
          settingsAPI.notifications(),
          smsAPI.templates().catch(() => ({ data: [] })),
        ]);
        if (settingsRes.data) setSettings((p: any) => ({ ...p, ...settingsRes.data }));
        setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
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
      await settingsAPI.updateNotifications(settings);
      toast.success("알림 설정이 저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async (templateType: string) => {
    try {
      await smsAPI.testSend({ type: templateType });
      toast.success("테스트 메시지가 발송되었습니다");
    } catch {
      toast.error("테스트 발송에 실패했습니다");
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string, visible: boolean) => {
    if (!value) return "";
    if (visible) return value;
    return value.slice(0, 4) + "*".repeat(Math.max(0, value.length - 4));
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
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-slate-900">알림 설정</h1>
        <p className="text-sm text-slate-500">SMS/알림톡 API 및 템플릿을 관리합니다</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="solapi">Solapi</TabsTrigger>
          <TabsTrigger value="sens">SENS</TabsTrigger>
        </TabsList>

        <TabsContent value="solapi">
          <Card>
            <CardHeader>
              <CardTitle>Solapi 설정</CardTitle>
              <CardDescription>Solapi API 키를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showKeys["solapi_key"] ? "text" : "password"}
                    value={settings.solapi?.api_key || ""}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        solapi: { ...p.solapi, api_key: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility("solapi_key")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showKeys["solapi_key"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>API Secret</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showKeys["solapi_secret"] ? "text" : "password"}
                    value={settings.solapi?.api_secret || ""}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        solapi: { ...p.solapi, api_secret: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility("solapi_secret")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showKeys["solapi_secret"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>발신번호</Label>
                <Input
                  value={settings.solapi?.sender_number || ""}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      solapi: { ...p.solapi, sender_number: e.target.value },
                    }))
                  }
                  placeholder="01012345678"
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sens">
          <Card>
            <CardHeader>
              <CardTitle>NAVER SENS 설정</CardTitle>
              <CardDescription>NAVER Cloud SENS API 키를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Access Key</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showKeys["sens_access"] ? "text" : "password"}
                    value={settings.sens?.access_key || ""}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        sens: { ...p.sens, access_key: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility("sens_access")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showKeys["sens_access"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Secret Key</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showKeys["sens_secret"] ? "text" : "password"}
                    value={settings.sens?.secret_key || ""}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        sens: { ...p.sens, secret_key: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility("sens_secret")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showKeys["sens_secret"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Service ID</Label>
                <Input
                  value={settings.sens?.service_id || ""}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      sens: { ...p.sens, service_id: e.target.value },
                    }))
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>발신번호</Label>
                <Input
                  value={settings.sens?.sender_number || ""}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      sens: { ...p.sens, sender_number: e.target.value },
                    }))
                  }
                  placeholder="01012345678"
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>메시지 템플릿</CardTitle>
          <CardDescription>유형별 메시지 템플릿을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TEMPLATE_TYPES.map((tt) => {
            const tmpl = templates.find((t) => t.type === tt.key);
            return (
              <div
                key={tt.key}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{tt.label}</p>
                  <p className="text-xs text-slate-400">
                    {tmpl ? tmpl.content?.slice(0, 50) + "..." : "템플릿 미설정"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestSend(tt.key)}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    테스트
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  );
}
