"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { settingsAPI, smsAPI } from "@/lib/api/admin";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Phone,
  MessageSquare,
  History,
  Copy,
} from "lucide-react";

// --- Types ---

interface NotificationSettingsData {
  provider: string;
  solapi_api_key: string;
  solapi_api_secret: string;
  solapi_sender: string;
  solapi_pfid: string;
  sens_access_key: string;
  sens_secret_key: string;
  sens_service_id: string;
  sens_sender: string;
}

interface Template {
  id: number;
  name: string;
  content: string;
  type: string;
}

interface NotificationLog {
  id: number;
  type: string;
  recipient: string;
  content: string;
  status: string;
  error_message?: string;
  created_at?: string;
}

interface SenderNumber {
  number: string;
  is_default: boolean;
}

// --- Template Variables ---

const TEMPLATE_VARIABLES = [
  { key: "{student_name}", label: "학생 이름" },
  { key: "{academy_name}", label: "학원 이름" },
  { key: "{amount}", label: "금액" },
  { key: "{month}", label: "납부 월" },
  { key: "{date}", label: "날짜" },
  { key: "{time}", label: "시간" },
  { key: "{phone}", label: "연락처" },
];

const TEMPLATE_TYPE_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "alimtalk", label: "알림톡" },
  { value: "push", label: "푸시" },
];

const DEFAULT_SETTINGS: NotificationSettingsData = {
  provider: "solapi",
  solapi_api_key: "",
  solapi_api_secret: "",
  solapi_sender: "",
  solapi_pfid: "",
  sens_access_key: "",
  sens_secret_key: "",
  sens_service_id: "",
  sens_sender: "",
};

// --- Component ---

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mainTab, setMainTab] = useState("provider");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<NotificationSettingsData>(DEFAULT_SETTINGS);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    content: "",
    type: "sms",
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Test send
  const [testPhone, setTestPhone] = useState("");
  const [testTemplate, setTestTemplate] = useState<Template | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Logs
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Sender numbers
  const [senderNumbers, setSenderNumbers] = useState<SenderNumber[]>([]);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, templatesRes] = await Promise.all([
          settingsAPI.notifications().catch(() => ({ data: null })),
          smsAPI.templates().catch(() => ({ data: [] })),
        ]);

        if (settingsRes.data) {
          const d = settingsRes.data;
          setSettings({
            provider: d.provider || "solapi",
            solapi_api_key: d.solapi_api_key || "",
            solapi_api_secret: d.solapi_api_secret || "",
            solapi_sender: d.solapi_sender || "",
            solapi_pfid: d.solapi_pfid || "",
            sens_access_key: d.sens_access_key || "",
            sens_secret_key: d.sens_secret_key || "",
            sens_service_id: d.sens_service_id || "",
            sens_sender: d.sens_sender || "",
          });
        }

        setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load logs when logs tab is active
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await smsAPI.logs({ limit: 50 });
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Load sender numbers
  const fetchSenderNumbers = useCallback(async () => {
    try {
      const { data } = await smsAPI.senderNumbers();
      setSenderNumbers(Array.isArray(data) ? data : []);
    } catch {
      setSenderNumbers([]);
    }
  }, []);

  useEffect(() => {
    if (mainTab === "logs") fetchLogs();
    if (mainTab === "sender") fetchSenderNumbers();
  }, [mainTab, fetchLogs, fetchSenderNumbers]);

  // Reload templates
  const reloadTemplates = async () => {
    try {
      const { data } = await smsAPI.templates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      // keep current
    }
  };

  // Save provider settings
  const handleSave = async () => {
    setSaving(true);
    try {
      // Send flat fields matching backend NotificationSettingsUpdate schema
      await settingsAPI.updateNotifications({
        provider: settings.provider as "solapi" | "sens",
        solapi_api_key: settings.solapi_api_key || undefined,
        solapi_api_secret: settings.solapi_api_secret || undefined,
        sens_access_key: settings.sens_access_key || undefined,
        sens_secret_key: settings.sens_secret_key || undefined,
        sens_service_id: settings.sens_service_id || undefined,
      });
      toast.success("알림 설정이 저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  // Toggle password visibility
  const toggleKey = (key: string) =>
    setShowKeys((p) => ({ ...p, [key]: !p[key] }));

  // Template CRUD
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", content: "", type: "sms" });
    setTemplateModal(true);
  };

  const openEditTemplate = (t: Template) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, content: t.content, type: t.type });
    setTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      toast.error("템플릿 이름과 내용을 입력하세요");
      return;
    }
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await smsAPI.updateTemplate(editingTemplate.id, templateForm);
      } else {
        await smsAPI.createTemplate(templateForm);
      }
      toast.success(editingTemplate ? "템플릿이 수정되었습니다" : "템플릿이 생성되었습니다");
      setTemplateModal(false);
      reloadTemplates();
    } catch {
      toast.error("템플릿 저장에 실패했습니다");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (t: Template) => {
    if (!confirm(`"${t.name}" 템플릿을 삭제하시겠습니까?`)) return;
    try {
      await smsAPI.deleteTemplate(t.id);
      toast.success("템플릿이 삭제되었습니다");
      reloadTemplates();
    } catch {
      toast.error("템플릿 삭제에 실패했습니다");
    }
  };

  // Insert variable into template content
  const insertVariable = (varKey: string) => {
    setTemplateForm((f) => ({
      ...f,
      content: f.content + varKey,
    }));
  };

  // Test send
  const handleTestSend = async () => {
    if (!testPhone.trim()) {
      toast.error("수신번호를 입력하세요");
      return;
    }
    const content = testTemplate?.content || "테스트 메시지입니다.";
    setSendingTest(true);
    try {
      await smsAPI.testSend({
        type: testTemplate?.type || "sms",
        phone: testPhone,
      });
      toast.success("테스트 메시지가 발송되었습니다");
    } catch {
      toast.error("테스트 발송에 실패했습니다");
    } finally {
      setSendingTest(false);
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-slate-900">알림 설정</h1>
        <p className="text-sm text-slate-500">
          SMS/알림톡 API, 템플릿, 발신번호를 관리합니다
        </p>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="provider">
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            API 설정
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            템플릿
          </TabsTrigger>
          <TabsTrigger value="sender">
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            발신번호
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="mr-1.5 h-3.5 w-3.5" />
            발송 내역
          </TabsTrigger>
        </TabsList>

        {/* ======================== Provider Config ======================== */}
        <TabsContent value="provider">
          {/* Provider toggle */}
          <div className="mb-4 flex gap-2">
            <Button
              variant={settings.provider === "solapi" ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings((s) => ({ ...s, provider: "solapi" }))}
            >
              Solapi
            </Button>
            <Button
              variant={settings.provider === "sens" ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings((s) => ({ ...s, provider: "sens" }))}
            >
              NAVER SENS
            </Button>
          </div>

          {settings.provider === "solapi" ? (
            <Card>
              <CardHeader>
                <CardTitle>Solapi 설정</CardTitle>
                <CardDescription>Solapi API 인증 정보를 입력하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SecretField
                  label="API Key"
                  value={settings.solapi_api_key}
                  onChange={(v) => setSettings((s) => ({ ...s, solapi_api_key: v }))}
                  visible={showKeys["solapi_key"]}
                  onToggle={() => toggleKey("solapi_key")}
                />
                <SecretField
                  label="API Secret"
                  value={settings.solapi_api_secret}
                  onChange={(v) => setSettings((s) => ({ ...s, solapi_api_secret: v }))}
                  visible={showKeys["solapi_secret"]}
                  onToggle={() => toggleKey("solapi_secret")}
                />
                <div>
                  <Label>발신번호</Label>
                  <Input
                    value={settings.solapi_sender}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, solapi_sender: e.target.value }))
                    }
                    placeholder="01012345678"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>PF ID (알림톡)</Label>
                  <Input
                    value={settings.solapi_pfid}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, solapi_pfid: e.target.value }))
                    }
                    placeholder="카카오 비즈니스 채널 PF ID"
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>NAVER SENS 설정</CardTitle>
                <CardDescription>NAVER Cloud SENS API 인증 정보를 입력하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SecretField
                  label="Access Key"
                  value={settings.sens_access_key}
                  onChange={(v) => setSettings((s) => ({ ...s, sens_access_key: v }))}
                  visible={showKeys["sens_access"]}
                  onToggle={() => toggleKey("sens_access")}
                />
                <SecretField
                  label="Secret Key"
                  value={settings.sens_secret_key}
                  onChange={(v) => setSettings((s) => ({ ...s, sens_secret_key: v }))}
                  visible={showKeys["sens_secret"]}
                  onToggle={() => toggleKey("sens_secret")}
                />
                <div>
                  <Label>Service ID</Label>
                  <Input
                    value={settings.sens_service_id}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, sens_service_id: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>발신번호</Label>
                  <Input
                    value={settings.sens_sender}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, sens_sender: e.target.value }))
                    }
                    placeholder="01012345678"
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "설정 저장"}
            </Button>
          </div>
        </TabsContent>

        {/* ======================== Templates ======================== */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>메시지 템플릿</CardTitle>
                <CardDescription>
                  유형별 메시지 템플릿을 생성하고 관리합니다
                </CardDescription>
              </div>
              <Button size="sm" onClick={openCreateTemplate}>
                <Plus className="mr-1 h-4 w-4" />
                템플릿 추가
              </Button>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">
                    등록된 템플릿이 없습니다
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={openCreateTemplate}
                  >
                    첫 번째 템플릿 만들기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{t.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {TEMPLATE_TYPE_OPTIONS.find((o) => o.value === t.type)?.label ?? t.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 truncate">
                          {t.content}
                        </p>
                      </div>
                      <div className="ml-3 flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTestTemplate(t);
                            setMainTab("test");
                          }}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTemplate(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteTemplate(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Send Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">테스트 발송</CardTitle>
              <CardDescription>
                템플릿을 선택하고 테스트 메시지를 발송합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>수신번호</Label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="01012345678"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>템플릿 선택</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <Button
                      key={t.id}
                      variant={testTemplate?.id === t.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestTemplate(t)}
                    >
                      {t.name}
                    </Button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-xs text-slate-400">
                      템플릿을 먼저 생성하세요
                    </p>
                  )}
                </div>
              </div>
              {testTemplate && (
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">미리보기</p>
                  <p className="text-sm">{testTemplate.content}</p>
                </div>
              )}
              <Button
                onClick={handleTestSend}
                disabled={sendingTest || !testPhone.trim()}
              >
                <Send className="mr-1.5 h-4 w-4" />
                {sendingTest ? "발송 중..." : "테스트 발송"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== Sender Numbers ======================== */}
        <TabsContent value="sender">
          <Card>
            <CardHeader>
              <CardTitle>등록된 발신번호</CardTitle>
              <CardDescription>
                현재 설정된 발신번호 목록입니다. 발신번호 변경은 API 설정 탭에서 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {senderNumbers.length === 0 ? (
                <div className="py-8 text-center">
                  <Phone className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">
                    등록된 발신번호가 없습니다
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    API 설정 탭에서 발신번호를 입력하세요
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>번호</TableHead>
                      <TableHead>기본</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {senderNumbers.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.number}</TableCell>
                        <TableCell>
                          {s.is_default && (
                            <Badge variant="outline" className="bg-green-50 text-green-600">
                              기본
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== Logs ======================== */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>발송 내역</CardTitle>
                <CardDescription>최근 50건의 발송 이력</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                새로고침
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : logs.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-400">
                  발송 내역이 없습니다
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>유형</TableHead>
                      <TableHead>수신자</TableHead>
                      <TableHead>내용</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.recipient}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {log.content}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              log.status === "sent"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }
                          >
                            {log.status === "sent" ? "성공" : "실패"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString("ko-KR")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======================== Template Create/Edit Modal ======================== */}
      <Dialog open={templateModal} onOpenChange={setTemplateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "템플릿 수정" : "새 템플릿 만들기"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>템플릿 이름</Label>
              <Input
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="예: 미납 알림"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>유형</Label>
              <div className="mt-1.5 flex gap-2">
                {TEMPLATE_TYPE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={templateForm.type === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setTemplateForm((f) => ({ ...f, type: opt.value }))
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>내용</Label>
              <textarea
                value={templateForm.content}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, content: e.target.value }))
                }
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={5}
                placeholder="[{academy_name}] {student_name}님, {month}월 수강료 {amount}원이 미납되었습니다."
              />
            </div>

            <div>
              <Label className="text-xs text-slate-500">변수 삽입</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button
                    key={v.key}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => insertVariable(v.key)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>

            {templateForm.content && (
              <div className="rounded-md border bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">미리보기</p>
                <p className="text-sm">
                  {templateForm.content
                    .replace("{student_name}", "김학생")
                    .replace("{academy_name}", "우리학원")
                    .replace("{amount}", "300,000")
                    .replace("{month}", "2")
                    .replace("{date}", "2026-02-17")
                    .replace("{time}", "14:00")
                    .replace("{phone}", "010-1234-5678")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateModal(false)}
              disabled={savingTemplate}
            >
              취소
            </Button>
            <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate
                ? "저장 중..."
                : editingTemplate
                  ? "수정"
                  : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Secret Field Component ---

function SecretField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1.5">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
