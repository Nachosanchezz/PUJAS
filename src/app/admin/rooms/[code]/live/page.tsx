import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  cancelAuction,
  pauseAuction,
  resumeAuction,
  startAuction,
} from "@/app/admin/auction-actions";
import { ActionButton } from "@/components/action-button";
import { AdminHeader } from "@/components/admin/admin-header";
import { AuctionCard } from "@/components/auction/auction-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { StandingsList } from "@/components/room/standings-list";
import { SectionTitle } from "@/components/ui/section-title";
import { requireAdmin } from "@/lib/admin-auth";
import { ROOM_STATUS_LABEL } from "@/lib/labels";
import { getOpenAuction, getTeamSummaries } from "@/lib/room-data";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Sala de control",
};

export default async function LiveControlPage({ params }: PageProps<"/admin/rooms/[code]/live">) {
  await requireAdmin();
  const { code } = await params;

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("id, code, name, status")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la sala");
  if (!room) notFound();

  const [auction, teams, available] = await Promise.all([
    getOpenAuction(room.id),
    getTeamSummaries(room.id),
    supabaseAdmin
      .from("players")
      .select("id, name, position")
      .eq("room_id", room.id)
      .eq("status", "available")
      .order("name"),
  ]);

  if (available.error) throw new Error("No se pudieron cargar los jugadores");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <RealtimeRefresh roomId={room.id} />

      <div className="flex flex-col gap-2">
        <AdminHeader title="Sala de control" backHref={`/admin/rooms/${room.code}`} />
        <p className="text-sm text-foreground/60">
          {room.name} · <span className="font-mono">{room.code}</span> · {ROOM_STATUS_LABEL[room.status]}
        </p>
      </div>

      {auction ? (
        <div className="flex flex-col gap-4">
          <AuctionCard auction={auction} />
          <div className="flex flex-wrap items-start justify-center gap-3">
            {auction.status === "running" ? (
              <ActionButton
                action={pauseAuction}
                fields={{ auctionId: auction.id }}
                label="Pausar"
                variant="secondary"
              />
            ) : (
              <ActionButton action={resumeAuction} fields={{ auctionId: auction.id }} label="Reanudar" />
            )}
            <ActionButton
              action={cancelAuction}
              fields={{ auctionId: auction.id }}
              label="Cancelar subasta"
              variant="danger"
              confirmMessage={`¿Cancelar la subasta de ${auction.playerName}? Volverá a la lista de disponibles.`}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-foreground/10 p-4 text-center text-foreground/70">
          No hay ningún jugador en subasta. Elige el siguiente de la lista.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle title="Jugadores disponibles" count={String(available.data.length)} />
        {available.data.length === 0 ? (
          <p className="text-foreground/60">No quedan jugadores disponibles.</p>
        ) : (
          <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
            {available.data.map((player) => (
              <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{player.name}</span>
                  {player.position && (
                    <span className="text-sm text-foreground/60">{player.position}</span>
                  )}
                </div>
                {!auction && (
                  <ActionButton
                    action={startAuction}
                    fields={{ roomId: room.id, playerId: player.id }}
                    label="Sacar a subasta"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Equipos" />
        <StandingsList teams={teams} />
      </section>
    </main>
  );
}
