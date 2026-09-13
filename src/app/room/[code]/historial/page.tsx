import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { HistoryCard } from "@/components/room/history-card";
import { RoomNav } from "@/components/room/room-nav";
import { formatMillions, formatTime } from "@/lib/format";
import { getHistory } from "@/lib/room-data";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Historial",
};

// Pública, como las plantillas: cualquiera con el enlace puede verla
export default async function HistoryPage({ params }: PageProps<"/room/[code]/historial">) {
  const { code } = await params;

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("id, code, name")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la sala");
  if (!room) notFound();

  const { entries, manualSales } = await getHistory(room.id);

  const totalBids = entries.reduce((sum, entry) => sum + entry.bids.length, 0);
  const mostContested = entries.reduce<(typeof entries)[number] | null>(
    (top, entry) => (entry.bids.length > (top?.bids.length ?? 0) ? entry : top),
    null,
  );

  return (
    <RoomRealtime roomId={room.id}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <RoomNav code={room.code} current="historial" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
            <p className="text-sm text-foreground/60">
              {room.name} · <span className="font-mono">{room.code}</span>
            </p>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat label="Subastas cerradas" value={String(entries.length)} />
          <Stat label="Pujas" value={String(totalBids)} />
          <Stat
            label="La más disputada"
            value={mostContested ? mostContested.playerName : "—"}
            detail={mostContested ? `${mostContested.bids.length} pujas` : undefined}
          />
        </dl>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-foreground/10 p-4 text-center text-foreground/70">
            Todavía no se ha cerrado ninguna subasta.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <HistoryCard key={entry.auctionId} entry={entry} />
            ))}
          </div>
        )}

        {manualSales.length > 0 && (
          <section aria-label="Adjudicados a mano" className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Adjudicados a mano</h2>
            <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 text-sm">
              {manualSales.map((sale) => (
                <li key={sale.playerId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <strong>{sale.playerName}</strong> → {sale.teamName} · {formatMillions(sale.price)}
                  </span>
                  {sale.at && (
                    <time dateTime={sale.at} className="text-foreground/50">
                      {formatTime(sale.at)}
                    </time>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
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
