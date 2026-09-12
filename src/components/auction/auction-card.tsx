import { Countdown } from "@/components/auction/countdown";
import { formatMillions } from "@/lib/format";
import type { AuctionView } from "@/lib/room-data";

// La tarjeta del jugador en subasta: la misma para el admin y los presidentes
export function AuctionCard({ auction }: { auction: AuctionView }) {
  const hasBids = auction.currentPrice !== null;

  return (
    <section
      aria-label="Jugador en subasta"
      className="flex flex-col items-center gap-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 text-center"
    >
      <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-500">
        En subasta
      </span>

      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-bold tracking-tight">{auction.playerName}</h2>
        {auction.playerPosition && <p className="text-foreground/60">{auction.playerPosition}</p>}
      </div>

      <Countdown
        endsAt={auction.endsAt}
        pausedRemainingMs={auction.pausedRemainingMs}
        serverNow={auction.serverNow}
      />

      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground/60">{hasBids ? "Puja actual" : "Precio de salida"}</span>
        <span className="text-5xl font-black tabular-nums">
          {formatMillions(auction.currentPrice ?? auction.startingPrice)}
        </span>
        <span className="text-foreground/70">
          {hasBids ? (
            <>
              Gana <strong className="text-foreground">{auction.leadingTeamName}</strong>
            </>
          ) : (
            "Todavía no hay pujas"
          )}
        </span>
      </div>
    </section>
  );
}
