import type { Enums } from "@/types/database";

// Record<Enum, string> obliga a traducir TODOS los valores: si mañana se
// añade un estado nuevo en la base de datos, TypeScript avisará aquí.
export const ROOM_STATUS_LABEL: Record<Enums<"room_status">, string> = {
  setup: "Preparación",
  live: "En directo",
  finished: "Terminada",
};

export const PLAYER_STATUS_LABEL: Record<Enums<"player_status">, string> = {
  available: "Disponible",
  in_auction: "En subasta",
  sold: "Vendido",
};
