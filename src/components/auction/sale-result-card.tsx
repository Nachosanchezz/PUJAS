import { formatMillions } from "@/lib/format";
import type { SaleResult } from "@/lib/room-data";

// Resultado de la última subasta: VENDIDO o sin pujas
export function SaleResultCard({ result }: { result: SaleResult }) {
  if (result.status === "sold") {
    return (
      <section
        aria-label="Resultado de la subasta"
        className="flex flex-col items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-8 text-center"
      >
        <span className="text-3xl font-black uppercase tracking-[0.3em] text-amber-400">Vendido</span>
        <h2 className="text-4xl font-bold tracking-tight">{result.playerName}</h2>
        <p className="text-xl text-foreground/80">{result.teamName}</p>
        <p className="text-5xl font-black tabular-nums">{formatMillions(result.price ?? 0)}</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Resultado de la subasta"
      className="flex flex-col items-center gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center"
    >
      <span className="text-2xl font-black uppercase tracking-[0.3em] text-foreground/60">Sin pujas</span>
      <h2 className="text-3xl font-bold tracking-tight">{result.playerName}</h2>
      <p className="text-foreground/70">Vuelve a la lista de disponibles</p>
    </section>
  );
}
