import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPlayer, createTeam, deletePlayer } from "@/app/admin/actions";
import { ActionForm } from "@/components/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { TextField } from "@/components/ui/text-field";
import { requireAdmin } from "@/lib/admin-auth";
import { formatMillions } from "@/lib/format";
import { PLAYER_STATUS_LABEL, ROOM_STATUS_LABEL } from "@/lib/labels";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Gestionar sala",
};

const POSITION_SUGGESTIONS = ["Portero", "Cierre", "Ala", "Pívot", "Universal"];

export default async function AdminRoomPage({ params }: PageProps<"/admin/rooms/[code]">) {
  await requireAdmin();
  const { code } = await params;

  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (roomError) throw new Error("No se pudo cargar la sala");
  if (!room) notFound();

  const [standings, players] = await Promise.all([
    supabaseAdmin.from("team_standings").select("*").eq("room_id", room.id).order("name"),
    supabaseAdmin
      .from("players")
      .select("id, name, position, status, is_captain, team_id, sold_price")
      .eq("room_id", room.id)
      .order("name"),
  ]);

  if (standings.error || players.error) {
    throw new Error("No se pudieron cargar los datos de la sala");
  }

  const teams = standings.data;
  const teamNames = new Map(teams.map((team) => [team.team_id, team.name]));
  const captains = new Map(
    players.data.filter((player) => player.is_captain).map((player) => [player.team_id, player.name]),
  );
  const auctionPlayers = players.data.filter((player) => !player.is_captain);
  const canAddTeams = room.status === "setup" && teams.length < room.max_teams;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
      <div className="flex flex-col gap-2">
        <AdminHeader title={room.name} backHref="/admin" />
        <p className="text-sm text-foreground/60">
          Código <span className="font-mono font-semibold text-foreground">{room.code}</span> ·{" "}
          {ROOM_STATUS_LABEL[room.status]} · {formatMillions(room.initial_budget)} por equipo
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Equipos" count={`${teams.length}/${room.max_teams}`} />

        {canAddTeams && (
          <ActionForm action={createTeam} submitLabel="Añadir equipo">
            <input type="hidden" name="roomId" value={room.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Nombre del equipo" name="name" required maxLength={40} />
              <TextField label="Presidente (capitán)" name="captainName" required maxLength={60} />
            </div>
          </ActionForm>
        )}

        {teams.length === 0 ? (
          <p className="text-foreground/60">Todavía no hay equipos.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => (
              <li
                key={team.team_id}
                className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{team.name}</span>
                  <span className="text-sm text-foreground/60">
                    {team.players_count}/{team.squad_size_cap} jugadores
                  </span>
                </div>
                <span className="text-sm text-foreground/60">
                  Presidente: {captains.get(team.team_id) ?? "—"}
                </span>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-foreground/60">Restante</dt>
                    <dd className="font-semibold">{formatMillions(team.remaining ?? 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">Puja máxima</dt>
                    <dd className="font-semibold text-emerald-500">
                      {formatMillions(team.max_bid ?? 0)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Jugadores en subasta" count={String(auctionPlayers.length)} />

        <ActionForm action={createPlayer} submitLabel="Añadir jugador">
          <input type="hidden" name="roomId" value={room.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Nombre" name="name" required maxLength={60} />
            <TextField
              label="Posición (opcional)"
              name="position"
              maxLength={30}
              list="position-suggestions"
            />
          </div>
          <datalist id="position-suggestions">
            {POSITION_SUGGESTIONS.map((position) => (
              <option key={position} value={position} />
            ))}
          </datalist>
        </ActionForm>

        {auctionPlayers.length === 0 ? (
          <p className="text-foreground/60">Todavía no hay jugadores.</p>
        ) : (
          <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
            {auctionPlayers.map((player) => (
              <li key={player.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm text-foreground/60">
                    {player.position ?? "Sin posición"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {player.status === "sold" ? (
                    <span>
                      {teamNames.get(player.team_id)} · {formatMillions(player.sold_price ?? 0)}
                    </span>
                  ) : (
                    <span className="text-foreground/60">{PLAYER_STATUS_LABEL[player.status]}</span>
                  )}
                  {player.status === "available" && (
                    <form action={deletePlayer}>
                      <input type="hidden" name="playerId" value={player.id} />
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-400"
                        aria-label={`Eliminar a ${player.name}`}
                      >
                        Eliminar
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function SectionTitle({ title, count }: { title: string; count: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      <span className="text-sm text-foreground/60">{count}</span>
    </div>
  );
}
