import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { leaveRoom } from "@/app/room/actions";
import { AuctionAutoClose } from "@/components/auction/auction-auto-close";
import { AuctionCard } from "@/components/auction/auction-card";
import { BidPanel } from "@/components/auction/bid-panel";
import { SaleResultCard } from "@/components/auction/sale-result-card";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { JoinForm } from "@/components/room/join-form";
import { StandingsList } from "@/components/room/standings-list";
import { formatMillions } from "@/lib/format";
import { getPresidentSession } from "@/lib/president-auth";
import { getLastResult, getOpenAuction, getTeamSummaries } from "@/lib/room-data";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Sala",
};

const WAITING_MESSAGE = {
  setup: "La subasta todavía no ha empezado. Deja esta página abierta.",
  live: "Esperando al siguiente jugador…",
  finished: "¡La subasta ha terminado! Todos los jugadores tienen equipo.",
} as const;

export default async function RoomPage({ params }: PageProps<"/room/[code]">) {
  const { code } = await params;

  // Página pública: solo pedimos columnas que puede ver cualquiera
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

  const heading = (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
        Sala {room.code}
      </span>
      <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
    </div>
  );

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
        {heading}
        {teams.length === 0 ? (
          <p className="text-foreground/70">El administrador todavía no ha creado los equipos.</p>
        ) : (
          <JoinForm roomCode={room.code} teams={teams} />
        )}
      </main>
    );
  }

  const myTeam = teams.find((team) => team.id === session.teamId);

  return (
    <RoomRealtime roomId={room.id}>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
        {heading}

        {auction ? (
          <div className="flex flex-col gap-4">
            <AuctionCard auction={auction} />
            {myTeam && (
              <BidPanel
                auction={auction}
                myTeamId={myTeam.id}
                maxBid={myTeam.maxBid}
                slotsLeft={myTeam.squadSizeCap - myTeam.playersCount}
              />
            )}
            <AuctionAutoClose auction={auction} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {lastResult && <SaleResultCard result={lastResult} />}
            <p className="rounded-xl border border-foreground/10 p-4 text-center text-foreground/70">
              {WAITING_MESSAGE[room.status]}
            </p>
          </div>
        )}

        <section className="flex flex-col gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
            Tu equipo
          </span>
          <h2 className="text-3xl font-bold tracking-tight">{session.teamName}</h2>
          {myTeam && (
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-foreground/60">Jugadores</dt>
                <dd className="text-lg font-semibold">
                  {myTeam.playersCount}/{myTeam.squadSizeCap}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/60">Restante</dt>
                <dd className="text-lg font-semibold">{formatMillions(myTeam.remaining)}</dd>
              </div>
              <div>
                <dt className="text-foreground/60">Puja máxima</dt>
                <dd className="text-lg font-semibold text-emerald-500">{formatMillions(myTeam.maxBid)}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">Equipos</h3>
          <StandingsList teams={teams} highlightTeamId={session.teamId} />
        </section>

        <form action={leaveRoom}>
          <input type="hidden" name="roomCode" value={room.code} />
          <button type="submit" className="text-sm text-foreground/60 hover:text-foreground">
            Salir de la sala
          </button>
        </form>
      </main>
    </RoomRealtime>
  );
}
