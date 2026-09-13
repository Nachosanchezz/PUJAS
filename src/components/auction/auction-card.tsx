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

  return (
    <section
      aria-label="Jugador en subasta"
      className="flex flex-col items-center gap-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 text-center"
    >
      <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-500">
        En subasta
      </span>

      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-bold tracking-tight">{live.playerName}</h2>
        {live.playerPosition && <p className="text-foreground/60">{live.playerPosition}</p>}
      </div>

      <Countdown endsAt={live.endsAt} pausedRemainingMs={live.pausedRemainingMs} serverNow={live.serverNow} />

      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground/60">{hasBids ? "Puja actual" : "Precio de salida"}</span>
        <span data-testid="current-price" className="text-5xl font-black tabular-nums">
          {formatMillions(live.currentPrice ?? live.startingPrice)}
        </span>
        <span className="text-foreground/70">
          {hasBids ? (
            <>
              Gana <strong className="text-foreground">{live.leadingTeamName}</strong>
            </>
          ) : (
            "Todavía no hay pujas"
          )}
        </span>
      </div>

      {live.recentBids.length > 0 && (
        <ol aria-label="Últimas pujas" className="flex w-full max-w-xs flex-col gap-1 text-sm">
          {live.recentBids.map((bid, index) => (
            <li
              key={bid.amount}
              className={`flex justify-between rounded-lg px-3 py-1.5 ${
                index === 0 ? "bg-emerald-500/10 font-semibold text-emerald-500" : "text-foreground/60"
              }`}
            >
              <span>{bid.teamName}</span>
              <span className="tabular-nums">{formatMillions(bid.amount)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
