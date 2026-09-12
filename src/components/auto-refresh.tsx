"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// PROVISIONAL (Fase 7): vuelve a pedir los datos de la página cada pocos
// segundos. En la Fase 9 lo sustituimos por Supabase Realtime (instantáneo).
export function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
