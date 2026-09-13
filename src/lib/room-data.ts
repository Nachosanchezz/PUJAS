import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Enums } from "@/types/database";

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

export type AuctionView = {
  id: string;
  status: Enums<"auction_status">;
  playerName: string;
  playerPosition: string | null;
  startingPrice: number;
  currentPrice: number | null;
  leadingTeamId: string | null;
  leadingTeamName: string | null;
  // Últimas pujas, de la más alta (la más reciente) a la más baja
  recentBids: { teamName: string; amount: number }[];
  endsAt: string | null;
  pausedRemainingMs: number | null;
  // Hora del servidor al generar la página: el contador la usa para
  // corregir la hora del dispositivo si está mal puesta
  serverNow: string;
};

export type SaleResult = {
  auctionId: string;
  status: "sold" | "unsold";
  playerName: string;
  teamName: string | null;
  price: number | null;
};

// Resultado de la última subasta cerrada (VENDIDO o sin pujas). Si la última
// se canceló, o si la venta se deshizo después, no hay nada que mostrar.
export async function getLastResult(roomId: string): Promise<SaleResult | null> {
  const { data, error } = await supabaseAdmin
    .from("auctions")
    .select("id, status, current_price, player:players(name, status), leading_team:teams(name)")
    .eq("room_id", roomId)
    .in("status", ["sold", "unsold", "cancelled"])
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar el último resultado");
  if (!data?.player) return null;
  if (data.status === "sold" && data.player.status === "sold") {
    return {
      auctionId: data.id,
      status: "sold",
      playerName: data.player.name,
      teamName: data.leading_team?.name ?? null,
      price: data.current_price,
    };
  }
  if (data.status === "unsold") {
    return { auctionId: data.id, status: "unsold", playerName: data.player.name, teamName: null, price: null };
  }
  return null;
}

// El jugador que está ahora mismo en subasta (en marcha o en pausa), si lo hay
export async function getOpenAuction(roomId: string): Promise<AuctionView | null> {
  const { data, error } = await supabaseAdmin
    .from("auctions")
    .select(
      "id, status, starting_price, current_price, leading_team_id, ends_at, paused_remaining_ms, player:players(name, position), leading_team:teams(name), bids(amount, team:teams(name))",
    )
    .eq("room_id", roomId)
    .in("status", ["running", "paused"])
    .order("amount", { referencedTable: "bids", ascending: false })
    .limit(6, { referencedTable: "bids" })
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la subasta");
  if (!data?.player) return null;

  return {
    id: data.id,
    status: data.status,
    playerName: data.player.name,
    playerPosition: data.player.position,
    startingPrice: data.starting_price,
    currentPrice: data.current_price,
    leadingTeamId: data.leading_team_id,
    leadingTeamName: data.leading_team?.name ?? null,
    recentBids: data.bids.map((bid) => ({ teamName: bid.team?.name ?? "", amount: bid.amount })),
    endsAt: data.ends_at,
    pausedRemainingMs: data.paused_remaining_ms,
    serverNow: new Date().toISOString(),
  };
}
