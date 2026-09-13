import { formatMillions, formatTime, formatTimeWithSeconds } from "@/lib/format";
import type { HistoryEntry } from "@/lib/room-data";

const BADGES = {
  sold: { label: "Vendido", className: "bg-amber-400/15 text-amber-400" },
  unsold: { label: "Sin pujas", className: "bg-foreground/10 text-foreground/60" },
  cancelled: { label: "Cancelada", className: "bg-red-500/10 text-red-500" },
  undone: { label: "Venta deshecha", className: "bg-red-500/10 text-red-500" },
} as const;

// Una subasta cerrada: todas sus pujas en orden y cómo terminó
export function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const badge = BADGES[entry.undone ? "undone" : entry.status];

  return (
    <article
      aria-label={`Subasta de ${entry.playerName}`}
      className="flex flex-col gap-3 rounded-2xl border border-foreground/10 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight">{entry.playerName}</h2>
          {entry.playerPosition && <p className="text-sm text-foreground/60">{entry.playerPosition}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          {entry.closedAt && (
            <time dateTime={entry.closedAt} className="text-xs text-foreground/50">
              {formatTime(entry.closedAt)}
            </time>
          )}
        </div>
      </div>

      {entry.bids.length > 0 && (
        <ol aria-label="Pujas" className="flex flex-col gap-1 text-sm">
          {entry.bids.map((bid, index) => {
            const winning = entry.status === "sold" && index === entry.bids.length - 1;
            return (
              <li
                key={bid.amount}
                className={`flex justify-between gap-3 ${winning ? "font-semibold text-amber-400" : "text-foreground/70"}`}
              >
                <span>
                  {bid.teamName} → {formatMillions(bid.amount)}
                </span>
                <time dateTime={bid.at} className="tabular-nums text-foreground/40">
                  {formatTimeWithSeconds(bid.at)}
                </time>
              </li>
            );
          })}
        </ol>
      )}

      <p className="border-t border-foreground/10 pt-3 text-sm">
        {entry.status === "sold" ? (
          <>
            Ganador: <strong>{entry.winnerName}</strong> — {formatMillions(entry.price ?? 0)}
          </>
        ) : entry.status === "unsold" ? (
          "Nadie pujó: volvió a la lista"
        ) : (
          "Cancelada: volvió a la lista"
        )}
      </p>
    </article>
  );
}
