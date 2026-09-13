import { formatMillions } from "@/lib/format";
import type { Squad } from "@/lib/room-data";

// Las plantillas en texto plano, listas para pegar en WhatsApp
export function buildSquadsText(roomName: string, squads: Squad[]): string {
  const blocks = squads.map((team) => {
    const players = team.players.map(
      (player) => `${player.name} — ${player.isCaptain ? "Presidente" : formatMillions(player.price)}`,
    );
    return [
      team.name.toUpperCase(),
      `Presupuesto restante: ${formatMillions(team.remaining)}`,
      "Jugadores:",
      ...players,
    ].join("\n");
  });

  return [`${roomName.toUpperCase()} · PLANTILLAS`, ...blocks].join("\n\n");
}
