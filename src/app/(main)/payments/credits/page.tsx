"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { paymentsAPI } from "@/lib/api/payments";
import { formatKRW, formatDate } from "@/lib/format";

interface Credit {
  id: number;
  student_id: number;
  student_name: string;
  balance: number;
  history?: CreditHistory[];
}

interface CreditHistory {
  id: number;
  type: "charge" | "use";
  amount: number;
  description: string;
  created_at: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      const { data } = await paymentsAPI.credits();
      setCredits(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setCredits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">크레딧 관리</h1>
        <p className="text-sm text-slate-500">
          학생별 크레딧 잔액 및 사용/충전 내역을 확인합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>학생별 크레딧 잔액</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : credits.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              크레딧 내역이 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생명</TableHead>
                  <TableHead className="text-right">잔액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.student_name}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatKRW(c.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Show history for each student that has it */}
      {credits
        .filter((c) => c.history && c.history.length > 0)
        .map((c) => (
          <Card key={c.id} className="mt-6">
            <CardHeader>
              <CardTitle>{c.student_name} - 크레딧 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>유형</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.history!.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            h.type === "charge"
                              ? "bg-green-50 text-green-600"
                              : "bg-amber-50 text-amber-600"
                          }
                        >
                          {h.type === "charge" ? "충전" : "사용"}
                        </Badge>
                      </TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell className="text-right">
                        {h.type === "charge" ? "+" : "-"}
                        {formatKRW(h.amount)}
                      </TableCell>
                      <TableCell>{formatDate(h.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
