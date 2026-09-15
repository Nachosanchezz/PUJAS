import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomRealtime } from "@/components/realtime/room-realtime";
import { RoomNav } from "@/components/room/room-nav";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDateTime, formatMillions } from "@/lib/format";
import { buildOrderText } from "@/lib/order-text";
import { getPresidentSession } from "@/lib/president-auth";
import { getDrawOrder } from "@/lib/room-data";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Orden de salida",
};

// Pública: todos ven en qué orden salen los jugadores y quién es el siguiente
export default async function OrderPage({ params }: PageProps<"/room/[code]/orden">) {
  const { code } = await params;

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("id, code, name")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la sala");
  if (!room) notFound();

  const [{ drawnAt, entries }, session] = await Promise.all([
    getDrawOrder(room.id),
    getPresidentSession(room.id),
  ]);
  // El siguiente: el primero disponible que aún no ha salido; los que salieron sin pujas, al final
  const next =
    entries.find((entry) => entry.status === "available" && !entry.unsold) ??
    entries.find((entry) => entry.status === "available");

  return (
    <RoomRealtime roomId={room.id} live={Boolean(session)}>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex flex-col gap-3">
          <RoomNav code={room.code} current="orden" president={Boolean(session)} />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl tracking-tight">Orden de salida</h1>
              <p className="text-sm text-foreground/60">
                {drawnAt
                  ? `Sorteado el ${formatDateTime(drawnAt)}`
                  : "Todavía no se ha sorteado: por ahora, orden alfabético"}
              </p>
            </div>
            <CopyButton value={buildOrderText(room.name, drawnAt, entries)} label="Copiar para WhatsApp" />
          </div>
        </div>

        <ol aria-label="Orden de salida" className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`flex items-center gap-3 px-4 py-3 ${entry.id === next?.id ? "bg-brand/10" : ""} ${
                entry.status === "sold" ? "opacity-60" : ""
              }`}
            >
              <span className="w-9 shrink-0 text-right font-display text-2xl font-extrabold italic text-foreground/40">
                {entry.order ?? index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">
                  {entry.name}
                  {entry.position && <span className="font-normal text-foreground/50"> · {entry.position}</span>}
                </span>
                {entry.status === "sold" && (
                  <span className="text-sm text-gold">
                    Vendido a {entry.teamName} · {formatMillions(entry.price ?? 0)}
                  </span>
                )}
                {entry.status === "in_auction" && (
                  <span className="text-sm font-semibold text-alert">En subasta ahora</span>
                )}
                {entry.unsold && <span className="text-sm text-foreground/50">Sin pujas · saldrá al final</span>}
              </div>
              {entry.id === next?.id && (
                <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-black">Siguiente</span>
              )}
            </li>
          ))}
        </ol>
      </main>
    </RoomRealtime>
  );
}
