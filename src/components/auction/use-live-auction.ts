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

  // Últimas pujas: las que trajo el servidor + las que han llegado por aviso
  const known = new Set(auction.recentBids.map((bid) => bid.amount));
  const fromEvents = bids
    .filter((bid) => bid.auctionId === auction.id && !known.has(bid.amount))
    .map(({ teamName, amount }) => ({ teamName, amount }));
  const recentBids = [...fromEvents, ...auction.recentBids]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, RECENT_BIDS);

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
