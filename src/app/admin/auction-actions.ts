"use server";

// Controles de la subasta del panel. Como todas las Server Actions del admin,
// empiezan con requireAdmin(); las reglas las impone la base de datos.

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RAISED_EXCEPTION, UNIQUE_VIOLATION } from "@/lib/validation";

const LIVE_PAGE = "/admin/rooms/[code]/live";

function finish(error: PostgrestError | null, fallback: string): FormState {
  if (error) {
    // Los mensajes de nuestras funciones SQL ya están en español
    if (error.code === RAISED_EXCEPTION) return { error: error.message };
    if (error.code === UNIQUE_VIOLATION) return { error: "Ya hay un jugador en subasta" };
    return { error: fallback };
  }
  revalidatePath(LIVE_PAGE, "page");
  return { error: null };
}

const startSchema = z.object({ roomId: z.uuid(), playerId: z.uuid() });

export async function startAuction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = startSchema.safeParse({
    roomId: formData.get("roomId"),
    playerId: formData.get("playerId"),
  });
  if (!parsed.success) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("start_auction", {
    p_room_id: parsed.data.roomId,
    p_player_id: parsed.data.playerId,
  });
  return finish(error, "No se pudo sacar el jugador a subasta");
}

function parseAuctionId(formData: FormData): string | null {
  const parsed = z.uuid().safeParse(formData.get("auctionId"));
  return parsed.success ? parsed.data : null;
}

export async function pauseAuction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const auctionId = parseAuctionId(formData);
  if (!auctionId) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("pause_auction", { p_auction_id: auctionId });
  return finish(error, "No se pudo pausar la subasta");
}

export async function resumeAuction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const auctionId = parseAuctionId(formData);
  if (!auctionId) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("resume_auction", { p_auction_id: auctionId });
  return finish(error, "No se pudo reanudar la subasta");
}

// "Adjudicar ya": cierra al momento y vende a quien vaya ganando
export async function forceCloseAuction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const auctionId = parseAuctionId(formData);
  if (!auctionId) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("close_auction", { p_auction_id: auctionId, p_force: true });
  return finish(error, "No se pudo cerrar la subasta");
}

const assignSchema = z.object({
  playerId: z.uuid({ error: "Elige un jugador" }),
  teamId: z.uuid({ error: "Elige un equipo" }),
  price: z.coerce.number().int("El precio debe ser un número entero").min(0, "El precio no puede ser negativo"),
});

export async function assignPlayer(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = assignSchema.safeParse({
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    price: formData.get("price"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("assign_player", {
    p_player_id: parsed.data.playerId,
    p_team_id: parsed.data.teamId,
    p_price: parsed.data.price,
  });
  return finish(error, "No se pudo adjudicar el jugador");
}

export async function unassignPlayer(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z.uuid().safeParse(formData.get("playerId"));
  if (!parsed.success) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("unassign_player", { p_player_id: parsed.data });
  return finish(error, "No se pudo deshacer la venta");
}

export async function cancelAuction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const auctionId = parseAuctionId(formData);
  if (!auctionId) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("cancel_auction", { p_auction_id: auctionId });
  return finish(error, "No se pudo cancelar la subasta");
}
