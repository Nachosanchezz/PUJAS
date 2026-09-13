import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { RoomNav } from "@/components/room/room-nav";
import { SquadCard } from "@/components/room/squad-card";
import { CopyButton } from "@/components/ui/copy-button";
import { formatMillions } from "@/lib/format";
import { getPresidentSession } from "@/lib/president-auth";
import { getSquads } from "@/lib/room-data";
import { buildSquadsText } from "@/lib/squads-text";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Plantillas",
};

// Pública: cualquiera con el enlace puede ver cómo van quedando los equipos
export default async function SquadsPage({ params }: PageProps<"/room/[code]/plantillas">) {
  const { code } = await params;

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("id, code, name")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la sala");
  if (!room) notFound();

  const [{ squads, soldCount, auctionPlayersCount }, session] = await Promise.all([
    getSquads(room.id),
    getPresidentSession(room.id),
  ]);

  const signings = squads.flatMap((team) =>
    team.players.filter((player) => !player.isCaptain).map((player) => ({ ...player, teamName: team.name })),
  );
  const totalSpent = signings.reduce((sum, player) => sum + player.price, 0);
  const topSigning = signings.reduce<(typeof signings)[number] | null>(
    (top, player) => (!top || player.price > top.price ? player : top),
    null,
  );

  return (
    <RoomRealtime roomId={room.id}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <RoomNav code={room.code} current="plantillas" />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Plantillas</h1>
              <p className="text-sm text-foreground/60">
                {room.name} · <span className="font-mono">{room.code}</span>
              </p>
            </div>
            <CopyButton value={buildSquadsText(room.name, squads)} label="Copiar para WhatsApp" />
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat label="Vendidos" value={`${soldCount}/${auctionPlayersCount}`} />
          <Stat label="Gastado entre todos" value={formatMillions(totalSpent)} />
          <Stat
            label="Fichaje más caro"
            value={topSigning ? `${topSigning.name} · ${formatMillions(topSigning.price)}` : "—"}
            detail={topSigning?.teamName}
          />
        </dl>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squads.map((team) => (
            <SquadCard key={team.id} team={team} highlight={team.id === session?.teamId} />
          ))}
        </div>
      </main>
    </RoomRealtime>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-foreground/10 p-4">
      <dt className="text-sm text-foreground/60">{label}</dt>
      <dd className="text-xl font-bold">{value}</dd>
      {detail && <dd className="text-sm text-foreground/60">{detail}</dd>}
    </div>
  );
}
