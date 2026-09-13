"use client";

import { useRoomEvents } from "@/components/realtime/room-realtime";
import type { AuctionView } from "@/lib/room-data";

const RECENT_BIDS = 6;

// Combina los datos que trajo el servidor con los avisos en tiempo real.
// Si el último aviso es más reciente que la página, se pinta ya: así una puja
// se ve al instante sin tener que volver a pedir la página al servidor.
export function useLiveAuction(auction: AuctionView): AuctionView {
  const { latest: event, bids } = useRoomEvents();

  if (!event || event.auctionId !== auction.id) return auction;
  if (Date.parse(event.serverNow) <= Date.parse(auction.serverNow)) return auction;

  // Últimas pujas: las que trajo el servidor + las que han llegado por aviso.
  // Cada importe es único en una subasta, así que lo usamos para no repetir ninguna.
  const byAmount = new Map<number, { teamName: string; amount: number }>();
  for (const bid of bids) {
    if (bid.auctionId === auction.id) byAmount.set(bid.amount, { teamName: bid.teamName, amount: bid.amount });
  }
  for (const bid of auction.recentBids) byAmount.set(bid.amount, bid);
  const recentBids = [...byAmount.values()].sort((a, b) => b.amount - a.amount).slice(0, RECENT_BIDS);

  return {
    ...auction,
    status: event.status,
    currentPrice: event.currentPrice,
    leadingTeamId: event.leadingTeamId,
    leadingTeamName: event.leadingTeamName,
    endsAt: event.endsAt,
    pausedRemainingMs: event.pausedRemainingMs,
    serverNow: event.serverNow,
    recentBids,
  };
}
