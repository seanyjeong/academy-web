"use client";

import { useEffect, useState, useCallback } from "react";
import { smsAPI } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Send, History } from "lucide-react";

const VARIABLES = [
  { key: "#{이름}", label: "이름" },
  { key: "#{학원명}", label: "학원명" },
  { key: "#{날짜}", label: "날짜" },
  { key: "#{금액}", label: "금액" },
];

export default function SmsPage() {
  const [activeTab, setActiveTab] = useState("send");
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [form, setForm] = useState({
    target: "all_students",
    status_filter: "active",
    message_type: "sms",
    template_id: "",
    message: "",
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await smsAPI.templates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await smsAPI.logs();
      setLogs(Array.isArray(data) ? data : data.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await smsAPI.recipientsCount({
        target: form.target,
        status: form.status_filter,
      });
      setRecipientCount(data.count ?? data);
    } catch {
      setRecipientCount(null);
    }
  }, [form.target, form.status_filter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const insertVariable = (variable: string) => {
    setForm((prev) => ({ ...prev, message: prev.message + variable }));
  };

  const selectTemplate = (templateId: string) => {
    setForm((prev) => ({ ...prev, template_id: templateId }));
    const tmpl = templates.find((t) => String(t.id) === templateId);
    if (tmpl?.content) {
      setForm((prev) => ({ ...prev, message: tmpl.content }));
    }
  };

  const handleSend = async () => {
    if (!form.message.trim()) {
      toast.error("메시지를 입력하세요");
      return;
    }
    setSending(true);
    try {
      await smsAPI.sendBulk({
        target: form.target,
        status_filter: form.status_filter,
        message_type: form.message_type,
        message: form.message,
      });
      toast.success("메시지가 발송되었습니다");
      setForm((prev) => ({ ...prev, message: "" }));
    } catch {
      toast.error("발송에 실패했습니다");
    } finally {
      setSending(false);
    }
  };

  const statusLabel: Record<string, string> = {
    success: "성공",
    failed: "실패",
    pending: "대기",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">SMS 발송</h1>
        <p className="text-sm text-slate-500">학생 및 학부모에게 메시지를 발송합니다</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="send">
            <Send className="mr-1.5 h-4 w-4" />
            발송
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="mr-1.5 h-4 w-4" />
            발송내역
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>메시지 작성</CardTitle>
                  <CardDescription>발송할 메시지를 작성하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>발송 대상</Label>
                      <Select
                        value={form.target}
                        onValueChange={(v) => setForm((p) => ({ ...p, target: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_students">전체 학생</SelectItem>
                          <SelectItem value="parents">학부모</SelectItem>
                          <SelectItem value="selected">특정 학생</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>상태 필터</Label>
                      <Select
                        value={form.status_filter}
                        onValueChange={(v) => setForm((p) => ({ ...p, status_filter: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">재원</SelectItem>
                          <SelectItem value="trial">체험</SelectItem>
                          <SelectItem value="paused">휴원</SelectItem>
                          <SelectItem value="all">전체</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>메시지 타입</Label>
                      <Select
                        value={form.message_type}
                        onValueChange={(v) => setForm((p) => ({ ...p, message_type: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="lms">LMS</SelectItem>
                          <SelectItem value="alimtalk">알림톡</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {templates.length > 0 && (
                    <div>
                      <Label>템플릿 선택</Label>
                      <Select value={form.template_id} onValueChange={selectTemplate}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="템플릿을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name || t.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>메시지 내용</Label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      rows={6}
                      placeholder="메시지를 입력하세요"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      {form.message.length}자
                      {form.message_type === "sms" && " / 90자"}
                      {form.message_type === "lms" && " / 2000자"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {VARIABLES.map((v) => (
                        <Button
                          key={v.key}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(v.key)}
                          className="text-xs"
                        >
                          {v.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">발송 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">수신 대상</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {recipientCount ?? "-"}
                    </p>
                    <p className="text-xs text-slate-400">명</p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSend}
                    disabled={sending || !form.message.trim()}
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    {sending ? "발송 중..." : "발송하기"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>발송 내역</CardTitle>
              <CardDescription>메시지 발송 기록을 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발송일시</TableHead>
                    <TableHead>대상</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>수신수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                        불러오는 중...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                        발송 내역이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.sent_at?.slice(0, 16).replace("T", " ") || "-"}</TableCell>
                        <TableCell>{log.target || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.message_type?.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.message}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === "success" ? "default" :
                              log.status === "failed" ? "destructive" : "secondary"
                            }
                          >
                            {statusLabel[log.status] || log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.recipient_count ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
