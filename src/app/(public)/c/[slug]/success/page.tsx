import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function ConsultationSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">상담 신청이 완료되었습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            접수가 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.
          </p>
          <p className="text-xs text-slate-400">
            일반적으로 1~2 영업일 내에 연락드립니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
