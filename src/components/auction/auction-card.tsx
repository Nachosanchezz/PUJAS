"use client";

import { Countdown } from "@/components/auction/countdown";
import { useLiveAuction } from "@/components/auction/use-live-auction";
import { formatMillions } from "@/lib/format";
import type { AuctionView } from "@/lib/room-data";

// La tarjeta del jugador en subasta: la misma para el admin y los presidentes.
// Es de cliente para poder pintar al instante los avisos en tiempo real.
export function AuctionCard({ auction }: { auction: AuctionView }) {
  const live = useLiveAuction(auction);
  const hasBids = live.currentPrice !== null;
  const price = live.currentPrice ?? live.startingPrice;

  return (
    <section
      aria-label="Jugador en subasta"
      className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.07] to-foreground/[0.02] p-6 text-center shadow-[0_0_80px_-30px] shadow-brand/40"
    >
      <div className="flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em]">
        <span className="flex items-center gap-2 text-alert">
          <span className="size-2 animate-urgent rounded-full bg-alert" aria-hidden />
          En directo
        </span>
        <span className="text-foreground/50">En subasta</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        {live.playerPosition && (
          <span className="rounded-full bg-foreground/10 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-foreground/70">
            {live.playerPosition}
          </span>
        )}
        <h2 className="text-5xl leading-none sm:text-6xl">{live.playerName}</h2>
      </div>

      <Countdown
        endsAt={live.endsAt}
        pausedRemainingMs={live.pausedRemainingMs}
        serverNow={live.serverNow}
        durationMs={live.durationMs}
      />

      <div className="flex flex-col items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
          {hasBids ? "Puja actual" : "Precio de salida"}
        </span>
        {/* La key hace que el precio "golpee" (animación) cada vez que cambia */}
        <span
          key={price}
          data-testid="current-price"
          className="animate-pop font-display text-7xl font-black italic leading-none tabular-nums"
        >
          {formatMillions(price)}
        </span>
        {hasBids ? (
          <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1 text-black">
            <span className="text-xs font-black uppercase tracking-widest">Gana</span>{" "}
            <strong className="font-display text-2xl font-extrabold italic uppercase leading-tight">
              {live.leadingTeamName}
            </strong>
          </span>
        ) : (
          <span className="text-foreground/60">Todavía no hay pujas</span>
        )}
      </div>

      {live.recentBids.length > 0 && (
        <ol aria-label="Últimas pujas" className="flex w-full max-w-xs flex-col gap-1 text-sm">
          {live.recentBids.map((bid, index) => (
            <li
              key={bid.amount}
              className={`flex justify-between rounded-lg px-3 py-1.5 ${
                index === 0 ? "bg-brand/10 font-bold text-brand" : "text-foreground/50"
              }`}
            >
              <span>{bid.teamName}</span>
              <span className="font-display text-base font-bold italic tabular-nums">
                {formatMillions(bid.amount)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
