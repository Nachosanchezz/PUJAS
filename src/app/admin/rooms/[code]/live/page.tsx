import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignPlayer,
  cancelAuction,
  forceCloseAuction,
  pauseAuction,
  resumeAuction,
  startAuction,
  unassignPlayer,
} from "@/app/admin/auction-actions";
import { ActionButton } from "@/components/action-button";
import { ActionForm } from "@/components/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { AuctionAutoClose } from "@/components/auction/auction-auto-close";
import { AuctionCard } from "@/components/auction/auction-card";
import { SaleResultCard } from "@/components/auction/sale-result-card";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { StandingsList } from "@/components/room/standings-list";
import { SectionTitle } from "@/components/ui/section-title";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { requireAdmin } from "@/lib/admin-auth";
import { formatMillions } from "@/lib/format";
import { ROOM_STATUS_LABEL } from "@/lib/labels";
import { getLastResult, getOpenAuction, getTeamSummaries } from "@/lib/room-data";
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

  const [auction, lastResult, teams, available, sold] = await Promise.all([
    getOpenAuction(room.id),
    getLastResult(room.id),
    getTeamSummaries(room.id),
    supabaseAdmin
      .from("players")
      .select("id, name, position")
      .eq("room_id", room.id)
      .eq("status", "available")
      .order("name"),
    supabaseAdmin
      .from("players")
      .select("id, name, sold_price, team:teams(name)")
      .eq("room_id", room.id)
      .eq("status", "sold")
      .eq("is_captain", false)
      .order("sold_at", { ascending: false }),
  ]);

  if (available.error || sold.error) throw new Error("No se pudieron cargar los jugadores");

  return (
    <RoomRealtime roomId={room.id}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <AdminHeader title="Sala de control" backHref={`/admin/rooms/${room.code}`} />
          <p className="text-sm text-foreground/60">
            {room.name} · <span className="font-mono">{room.code}</span> · {ROOM_STATUS_LABEL[room.status]}
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href={`/room/${room.code}/plantillas`}
              target="_blank"
              className="text-brand hover:text-brand-light"
            >
              Plantillas ↗
            </Link>
            <Link
              href={`/room/${room.code}/historial`}
              target="_blank"
              className="text-brand hover:text-brand-light"
            >
              Historial ↗
            </Link>
          </div>
        </div>

        {auction ? (
          <div className="flex flex-col gap-4">
            <AuctionCard auction={auction} />
            <AuctionAutoClose auction={auction} />
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
                action={forceCloseAuction}
                fields={{ auctionId: auction.id }}
                label="Adjudicar ya"
                variant="secondary"
                confirmMessage={`¿Cerrar ya la subasta de ${auction.playerName}? Se venderá a quien vaya ganando (si nadie ha pujado, vuelve a la lista).`}
              />
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
          <div className="flex flex-col gap-4">
            {lastResult && <SaleResultCard result={lastResult} />}
            <p className="rounded-xl border border-foreground/10 p-4 text-center text-foreground/70">
              {room.status === "finished"
                ? "¡Subasta terminada! Todos los jugadores tienen equipo."
                : "No hay ningún jugador en subasta. Elige el siguiente de la lista."}
            </p>
          </div>
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

        <section className="flex flex-col gap-4">
          <SectionTitle title="Vendidos" count={String(sold.data.length)} />
          {sold.data.length === 0 ? (
            <p className="text-foreground/60">Todavía no se ha vendido ningún jugador.</p>
          ) : (
            <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
              {sold.data.map((player) => (
                <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm text-foreground/60">
                      {player.team?.name} · {formatMillions(player.sold_price ?? 0)}
                    </span>
                  </div>
                  <ActionButton
                    action={unassignPlayer}
                    fields={{ playerId: player.id }}
                    label="Deshacer"
                    variant="danger"
                    confirmMessage={`¿Deshacer la venta de ${player.name}? Volverá a la lista y ${player.team?.name} recuperará ${formatMillions(player.sold_price ?? 0)}.`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {available.data.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionTitle title="Adjudicar a mano" />
            <p className="text-sm text-foreground/60">
              Para corregir errores: asigna un jugador disponible a un equipo por el precio que digas.
            </p>
            <ActionForm action={assignPlayer} submitLabel="Adjudicar">
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectField
                  label="Jugador"
                  name="playerId"
                  required
                  placeholder="Elige jugador"
                  options={available.data.map((player) => ({ value: player.id, label: player.name }))}
                />
                <SelectField
                  label="Equipo"
                  name="teamId"
                  required
                  placeholder="Elige equipo"
                  options={teams.map((team) => ({ value: team.id, label: team.name }))}
                />
                <TextField label="Precio (M€)" name="price" type="number" min={0} required />
              </div>
            </ActionForm>
          </section>
        )}
      </main>
    </RoomRealtime>
  );
}
