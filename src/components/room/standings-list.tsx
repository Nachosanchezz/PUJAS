import { formatMillions } from "@/lib/format";
import type { TeamSummary } from "@/lib/room-data";

type StandingsListProps = {
  teams: TeamSummary[];
  highlightTeamId?: string;
};

export function StandingsList({ teams, highlightTeamId }: StandingsListProps) {
  return (
    <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
      {teams.map((team) => (
        <li
          key={team.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 ${
            team.id === highlightTeamId ? "bg-brand/5" : ""
          }`}
        >
          <div className="flex flex-col">
            <span className="font-semibold">{team.name}</span>
            <span className="text-sm text-foreground/60">
              {team.playersCount}/{team.squadSizeCap} jugadores
            </span>
          </div>
          <div className="flex flex-col items-end text-sm">
            <span className="font-semibold">{formatMillions(team.remaining)}</span>
            <span className="text-foreground/60">máx. {formatMillions(team.maxBid)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
