import { formatDateTime } from "@/lib/format";
import type { OrderEntry } from "@/lib/room-data";

// El orden de salida en texto, listo para pegar en WhatsApp
export function buildOrderText(roomName: string, drawnAt: string | null, entries: OrderEntry[]): string {
  const header = [`${roomName.toUpperCase()} · ORDEN DE SALIDA`];
  if (drawnAt) header.push(`Sorteado el ${formatDateTime(drawnAt)}`);
  const lines = entries.map(
    (entry, index) => `${entry.order ?? index + 1}. ${entry.name}${entry.position ? ` (${entry.position})` : ""}`,
  );
  return [...header, "", ...lines].join("\n");
}
