"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SessionRecordsRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/training/tests/${params.testId}/${params.sessionId}`
    );
  }, [params.testId, params.sessionId, router]);

  return null;
}
