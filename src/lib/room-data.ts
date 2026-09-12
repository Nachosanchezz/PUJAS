import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type TeamSummary = {
  id: string;
  name: string;
  captain: string | null;
  playersCount: number;
  squadSizeCap: number;
  remaining: number;
  maxBid: number;
};

// Resumen de los equipos de una sala que puede ver cualquiera: sin PINs
export async function getTeamSummaries(roomId: string): Promise<TeamSummary[]> {
  const [standings, captains] = await Promise.all([
    supabaseAdmin
      .from("team_standings")
      .select("team_id, name, players_count, squad_size_cap, remaining, max_bid")
      .eq("room_id", roomId)
      .order("name"),
    supabaseAdmin.from("players").select("team_id, name").eq("room_id", roomId).eq("is_captain", true),
  ]);

  if (standings.error || captains.error) {
    throw new Error("No se pudieron cargar los equipos");
  }

  const captainByTeam = new Map(captains.data.map((player) => [player.team_id, player.name]));

  // Las columnas de una vista llegan como "posiblemente null": aquí las normalizamos
  return standings.data.map((team) => ({
    id: team.team_id ?? "",
    name: team.name ?? "",
    captain: captainByTeam.get(team.team_id) ?? null,
    playersCount: team.players_count ?? 0,
    squadSizeCap: team.squad_size_cap ?? 0,
    remaining: team.remaining ?? 0,
    maxBid: team.max_bid ?? 0,
  }));
}
