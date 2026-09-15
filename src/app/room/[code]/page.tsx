import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveRoom } from "@/app/room/actions";
import { AuctionAutoClose } from "@/components/auction/auction-auto-close";
import { AuctionCard } from "@/components/auction/auction-card";
import { BidPanel } from "@/components/auction/bid-panel";
import { SaleResultCard } from "@/components/auction/sale-result-card";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { JoinForm } from "@/components/room/join-form";
import { RoomNav } from "@/components/room/room-nav";
import { StandingsList } from "@/components/room/standings-list";
import { formatMillions } from "@/lib/format";
import { getPresidentSession } from "@/lib/president-auth";
import { getLastResult, getOpenAuction, getSquads } from "@/lib/room-data";
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

  const [session, { squads: teams }, auction, lastResult] = await Promise.all([
    getPresidentSession(room.id),
    getSquads(room.id),
    getOpenAuction(room.id),
    getLastResult(room.id),
  ]);

  const heading = (
    <div className="flex flex-col gap-3">
      <RoomNav code={room.code} current="sala" president={Boolean(session)} />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand">
          Sala {room.code}
        </span>
        <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
      </div>
    </div>
  );

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
        {heading}
        <Link
          href={`/room/${room.code}/directo`}
          className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 py-3 text-sm transition-colors hover:border-brand"
        >
          <span className="text-foreground/70">¿No eres presidente? Mira la subasta sin pujar</span>
          <span className="shrink-0 font-semibold text-brand">En directo →</span>
        </Link>
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

        <section className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
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
                <dd className="text-lg font-semibold text-brand">{formatMillions(myTeam.maxBid)}</dd>
              </div>
            </dl>
          )}
          {myTeam && (
            <ul aria-label="Tu plantilla" className="flex flex-col gap-1 border-t border-brand/20 pt-3 text-sm">
              {myTeam.players.map((player) => (
                <li key={player.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {player.name}
                    {player.position && <span className="text-foreground/50"> · {player.position}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground/70">
                    {player.isCaptain ? "Presidente" : formatMillions(player.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">Equipos</h3>
            <Link
              href={`/room/${room.code}/plantillas`}
              className="text-sm font-semibold text-brand hover:text-brand-light"
            >
              Ver plantillas →
            </Link>
          </div>
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
