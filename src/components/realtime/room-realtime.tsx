"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Enums } from "@/types/database";

// Red de seguridad: si el canal en tiempo real falla, refrescamos cada 3 s
const FALLBACK_POLL_MS = 3000;
const MAX_EVENT_BIDS = 20;

// Estado de la subasta que viaja dentro del aviso en tiempo real
export type AuctionEvent = {
  auctionId: string;
  status: Enums<"auction_status">;
  currentPrice: number | null;
  leadingTeamId: string | null;
  leadingTeamName: string | null;
  endsAt: string | null;
  pausedRemainingMs: number | null;
  serverNow: string;
};

export type EventBid = { auctionId: string; teamName: string; amount: number };

type RoomEvents = {
  // El último aviso de subasta recibido
  latest: AuctionEvent | null;
  // Las pujas que han ido llegando por aviso (para la lista de "últimas pujas")
  bids: EventBid[];
};

const RoomEventsContext = createContext<RoomEvents>({ latest: null, bids: [] });

export function useRoomEvents(): RoomEvents {
  return useContext(RoomEventsContext);
}

const STATUSES: string[] = ["running", "paused", "sold", "unsold", "cancelled"];

// El aviso llega de la red: comprobamos su forma antes de fiarnos de él
function parseAuctionEvent(payload: unknown): AuctionEvent | null {
  if (typeof payload !== "object" || payload === null) return null;
  const data = payload as Record<string, unknown>;
  if (
    typeof data.auction_id !== "string" ||
    typeof data.server_now !== "string" ||
    typeof data.status !== "string" ||
    !STATUSES.includes(data.status)
  ) {
    return null;
  }
  const numberOrNull = (value: unknown) => (typeof value === "number" ? value : null);
  const stringOrNull = (value: unknown) => (typeof value === "string" ? value : null);

  return {
    auctionId: data.auction_id,
    status: data.status as Enums<"auction_status">,
    currentPrice: numberOrNull(data.current_price),
    leadingTeamId: stringOrNull(data.leading_team_id),
    leadingTeamName: stringOrNull(data.leading_team_name),
    endsAt: stringOrNull(data.ends_at),
    pausedRemainingMs: numberOrNull(data.paused_remaining_ms),
    serverNow: data.server_now,
  };
}

// ¿Basta con el aviso para pintar el cambio, o hay que recargar la página?
// Pujas y pausas viajan completas en el aviso; un jugador nuevo, un cierre
// o una corrección cambian cosas que el aviso no trae (plantillas, listas...).
function needsReload(event: AuctionEvent | null): boolean {
  if (!event) return true;
  if (event.status !== "running" && event.status !== "paused") return true;
  return event.status === "running" && event.currentPrice === null;
}

// Escucha los avisos de la sala (Supabase Realtime) y los comparte con los
// componentes de la subasta, que los pintan al instante.
export function RoomRealtime({ roomId, children }: { roomId: string; children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState("connecting");
  const [events, setEvents] = useState<RoomEvents>({ latest: null, bids: [] });

  useEffect(() => {
    let active = true;
    let pending: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;

    // Varios avisos seguidos se agrupan en una sola recarga
    const refresh = () => {
      clearTimeout(pending);
      pending = setTimeout(() => router.refresh(), 50);
    };
    const startPolling = () => {
      poll ??= setInterval(refresh, FALLBACK_POLL_MS);
    };

    const channel = supabase.channel(`room:${roomId}`, { config: { private: true } });
    channel.on("broadcast", { event: "changed" }, (message) => {
      const event = parseAuctionEvent(message.payload);
      if (event) {
        setEvents((previous) => {
          const sameAuction = previous.bids.filter((bid) => bid.auctionId === event.auctionId);
          const bids =
            event.currentPrice !== null && event.leadingTeamName !== null
              ? [...sameAuction, { auctionId: event.auctionId, teamName: event.leadingTeamName, amount: event.currentPrice }]
              : sameAuction;
          return { latest: event, bids: bids.slice(-MAX_EVENT_BIDS) };
        });
      }
      if (needsReload(event)) refresh();
    });

    supabase.realtime
      .setAuth()
      .then(() => {
        channel.subscribe((state) => {
          if (!active) return;
          setStatus(state);
          if (state === "SUBSCRIBED") {
            clearInterval(poll);
            poll = undefined;
            // Al (re)conectar nos ponemos al día por si nos perdimos algún aviso
            refresh();
          } else {
            startPolling();
          }
        });
      })
      .catch(() => {
        if (active) startPolling();
      });

    // Los móviles cortan la conexión en segundo plano: al volver, actualizamos
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearTimeout(pending);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [roomId, router]);

  return (
    <RoomEventsContext value={events}>
      {children}
      {/* Invisible: solo sirve para diagnosticar el estado de la conexión */}
      <span hidden data-testid="realtime-status" data-status={status} />
    </RoomEventsContext>
  );
}
