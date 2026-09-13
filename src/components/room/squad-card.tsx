import { formatMillions } from "@/lib/format";
import type { Squad } from "@/lib/room-data";

type SquadCardProps = {
  team: Squad;
  highlight?: boolean;
};

// Plantilla de un equipo: presupuesto, jugadores con su precio y plazas libres
export function SquadCard({ team, highlight = false }: SquadCardProps) {
  const emptySlots = Math.max(team.squadSizeCap - team.playersCount, 0);

  return (
    <section
      aria-label={`Plantilla de ${team.name}`}
      className={`flex flex-col gap-4 rounded-2xl border p-5 ${
        highlight ? "border-brand/50 bg-brand/5" : "border-foreground/10"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight">{team.name}</h2>
        <span className="text-sm text-foreground/60">
          {team.playersCount}/{team.squadSizeCap}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-foreground/60">Restante</dt>
          <dd className="font-semibold">{formatMillions(team.remaining)}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">Gastado</dt>
          <dd className="font-semibold">{formatMillions(team.spent)}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">Puja máx.</dt>
          <dd className="font-semibold text-brand">{formatMillions(team.maxBid)}</dd>
        </div>
      </dl>

      <ol className="flex flex-col gap-1 text-sm">
        {team.players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-foreground/[0.03] px-3 py-2"
          >
            <span className="truncate">
              {player.name}
              {player.position && <span className="text-foreground/50"> · {player.position}</span>}
            </span>
            {player.isCaptain ? (
              <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">
                Presidente
              </span>
            ) : (
              <span className="shrink-0 font-semibold tabular-nums">{formatMillions(player.price)}</span>
            )}
          </li>
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <li
            key={`empty-${index}`}
            className="rounded-lg border border-dashed border-foreground/10 px-3 py-2 text-foreground/30"
          >
            Plaza libre
          </li>
        ))}
      </ol>
    </section>
  );
}
