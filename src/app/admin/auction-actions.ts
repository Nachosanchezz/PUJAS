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

export async function cancelAuction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const auctionId = parseAuctionId(formData);
  if (!auctionId) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("cancel_auction", { p_auction_id: auctionId });
  return finish(error, "No se pudo cancelar la subasta");
}
