"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { consultationsAPI } from "@/lib/api/consultations";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Phone, User } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "접수 대기",
  in_progress: "상담 진행중",
  completed: "상담 완료",
  cancelled: "취소됨",
};

export default function ReservationPage() {
  const params = useParams();
  const reservationNumber = params.reservationNumber as string;
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await consultationsAPI.reservation(reservationNumber);
        setReservation(data);
      } catch {
        setReservation(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reservationNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">예약 정보를 찾을 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">상담 예약 확인</CardTitle>
          <CardDescription>예약번호: {reservationNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <Badge
              variant={
                reservation.status === "completed" ? "default" :
                reservation.status === "cancelled" ? "destructive" : "secondary"
              }
              className="text-sm"
            >
              {STATUS_LABELS[reservation.status] || reservation.status}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">이름</p>
                <p className="text-sm font-medium">{reservation.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">연락처</p>
                <p className="text-sm font-medium">{reservation.phone}</p>
              </div>
            </div>
            {reservation.consultation_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">상담 예정일</p>
                  <p className="text-sm font-medium">{reservation.consultation_date}</p>
                </div>
              </div>
            )}
          </div>

          {reservation.academy_name && (
            <>
              <Separator />
              <div className="text-center">
                <p className="text-xs text-slate-400">{reservation.academy_name}</p>
                {reservation.academy_phone && (
                  <p className="text-xs text-slate-400">{reservation.academy_phone}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
