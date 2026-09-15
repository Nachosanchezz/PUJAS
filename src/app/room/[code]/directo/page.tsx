import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuctionCard } from "@/components/auction/auction-card";
import { SaleResultCard } from "@/components/auction/sale-result-card";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { RoomNav } from "@/components/room/room-nav";
import { StandingsList } from "@/components/room/standings-list";
import { getPresidentSession } from "@/lib/president-auth";
import { getLastResult, getOpenAuction, getTeamSummaries } from "@/lib/room-data";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "En directo",
  description: "Sigue la subasta en directo: quién sale, cuánto pujan y a qué equipo va cada jugador",
};

const WAITING_MESSAGE = {
  setup: "La subasta todavía no ha empezado. Deja esta página abierta: se actualiza sola.",
  live: "Esperando al siguiente jugador…",
  finished: "¡La subasta ha terminado! Todos los jugadores tienen equipo.",
} as const;

// Pública y solo para mirar: los jugadores siguen la subasta sin PIN.
// No cierra la subasta al llegar a 0: eso ya lo piden las pantallas del admin
// y de los presidentes, y así no se suman decenas de peticiones más.
export default async function LivePage({ params }: PageProps<"/room/[code]/directo">) {
  const { code } = await params;

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("id, code, name, status")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la sala");
  if (!room) notFound();

  const [session, teams, auction, lastResult] = await Promise.all([
    getPresidentSession(room.id),
    getTeamSummaries(room.id),
    getOpenAuction(room.id),
    getLastResult(room.id),
  ]);

  return (
    <RoomRealtime roomId={room.id} live={Boolean(session)}>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <RoomNav code={room.code} current="directo" president={Boolean(session)} />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              Sala {room.code} · En directo
            </span>
            <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
          </div>
        </div>

        {auction ? (
          <AuctionCard auction={auction} />
        ) : (
          <div className="flex flex-col gap-4">
            {lastResult && <SaleResultCard result={lastResult} />}
            <p className="rounded-xl border border-foreground/10 p-4 text-center text-foreground/70">
              {WAITING_MESSAGE[room.status]}
            </p>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Equipos</h2>
            <Link
              href={`/room/${room.code}/plantillas`}
              className="text-sm font-semibold text-brand hover:text-brand-light"
            >
              Ver plantillas →
            </Link>
          </div>
          <StandingsList teams={teams} />
        </section>

        <p className="text-center text-sm text-foreground/60">
          Solo pujan los presidentes.{" "}
          <Link href={`/room/${room.code}`} className="font-semibold text-brand hover:text-brand-light">
            {session ? "Volver a tu sala →" : "Entrar con PIN →"}
          </Link>
        </p>
      </main>
    </RoomRealtime>
  );
}
