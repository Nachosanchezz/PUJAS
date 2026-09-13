"use client";

import { useEffect } from "react";
import { closeExpiredAuction } from "@/app/room/actions";
import { useLiveAuction } from "@/components/auction/use-live-auction";
import { useRemainingMs } from "@/components/auction/use-remaining-ms";
import type { AuctionView } from "@/lib/room-data";

// Cuando el contador llega a 0, cualquier pantalla abierta pide al servidor que
// cierre la subasta. El servidor solo la cierra si de verdad ha terminado, así
// que da igual que lo pidan varias pantallas a la vez o un poco antes de tiempo.
export function AuctionAutoClose({ auction }: { auction: AuctionView }) {
  const live = useLiveAuction(auction);
  const remainingMs = useRemainingMs(live.endsAt, live.serverNow);

  useEffect(() => {
    if (live.status !== "running" || remainingMs !== 0) return;

    const attempt = () => void closeExpiredAuction(live.id);
    // Un pequeño margen para no adelantarnos al reloj del servidor, y
    // reintentos por si una puja de último segundo amplió el tiempo
    const first = setTimeout(attempt, 300);
    const retry = setInterval(attempt, 1500);
    return () => {
      clearTimeout(first);
      clearInterval(retry);
    };
  }, [live.status, live.id, remainingMs]);

  return null;
}
