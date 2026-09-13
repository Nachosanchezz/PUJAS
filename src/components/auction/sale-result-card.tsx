import { formatMillions } from "@/lib/format";
import type { SaleResult } from "@/lib/room-data";

// Resultado de la última subasta: sello de VENDIDO o "sin pujas"
export function SaleResultCard({ result }: { result: SaleResult }) {
  if (result.status === "sold") {
    return (
      <section
        aria-label="Resultado de la subasta"
        className="flex flex-col items-center gap-2 overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-gold/20 to-gold/[0.03] px-6 py-10 text-center shadow-[0_0_80px_-30px] shadow-gold/60"
      >
        {/* La key hace que el sello vuelva a caer con cada venta nueva */}
        <span
          key={result.auctionId}
          className="animate-stamp rounded-xl border-4 border-gold px-5 py-1 font-display text-5xl font-black italic uppercase tracking-wider text-gold"
        >
          Vendido
        </span>
        <h2 className="mt-6 text-5xl leading-none">{result.playerName}</h2>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">Nuevo fichaje de</p>
        <p className="font-display text-3xl font-extrabold italic uppercase leading-none text-gold">
          {result.teamName}
        </p>
        <p className="mt-2 font-display text-6xl font-black italic tabular-nums">{formatMillions(result.price ?? 0)}</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Resultado de la subasta"
      className="flex flex-col items-center gap-2 rounded-3xl border border-foreground/10 bg-foreground/[0.03] px-6 py-8 text-center"
    >
      <span className="font-display text-3xl font-black italic uppercase tracking-wider text-foreground/50">
        Sin pujas
      </span>
      <h2 className="text-4xl leading-none">{result.playerName}</h2>
      <p className="text-foreground/60">Vuelve a la lista de disponibles</p>
    </section>
  );
}
