"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import {
  endPresidentSession,
  getPresidentSession,
  startPresidentSession,
} from "@/lib/president-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { firstIssue, RAISED_EXCEPTION, UNIQUE_VIOLATION } from "@/lib/validation";

const ROOM_CODE = /^[A-Z0-9]{6}$/;

const joinSchema = z.object({
  roomCode: z.string().regex(ROOM_CODE, "Sala no válida"),
  teamId: z.uuid({ error: "Elige tu equipo" }),
  pin: z.string().regex(/^[0-9]{4}$/, "El PIN son 4 cifras"),
});

export async function joinRoom(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse({
    roomCode: formData.get("roomCode"),
    teamId: formData.get("teamId"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { roomCode, teamId, pin } = parsed.data;

  // El equipo tiene que pertenecer a la sala del enlace
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, rooms!inner(code)")
    .eq("id", teamId)
    .eq("rooms.code", roomCode)
    .maybeSingle();
  if (!team) return { error: "Ese equipo no es de esta sala" };

  const { data: result, error } = await supabaseAdmin.rpc("verify_team_pin", {
    p_team_id: teamId,
    p_pin: pin,
  });

  if (error) return { error: "No se pudo comprobar el PIN. Inténtalo de nuevo" };
  if (result === "locked") return { error: "Demasiados intentos fallidos. Espera 5 minutos" };
  if (result !== "ok") return { error: "PIN incorrecto" };

  await startPresidentSession(teamId, pin);
  redirect(`/room/${roomCode}`);
}

const bidSchema = z.object({
  roomCode: z.string().regex(ROOM_CODE),
  auctionId: z.uuid(),
  amount: z.coerce.number().int().positive(),
});

export async function placeBid(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = bidSchema.safeParse({
    roomCode: formData.get("roomCode"),
    auctionId: formData.get("auctionId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: "Puja no válida" };

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("id")
    .eq("code", parsed.data.roomCode)
    .maybeSingle();
  if (!room) return { error: "Sala no encontrada" };

  // El equipo sale de la cookie firmada, NUNCA del formulario: así nadie
  // puede pujar en nombre de otro equipo aunque manipule la petición.
  const session = await getPresidentSession(room.id);
  if (!session) return { error: "Tu sesión ha caducado. Vuelve a entrar con tu PIN" };

  const { error } = await supabaseAdmin.rpc("place_bid", {
    p_auction_id: parsed.data.auctionId,
    p_team_id: session.teamId,
    p_amount: parsed.data.amount,
  });

  if (error) {
    if (error.code === RAISED_EXCEPTION) return { error: error.message };
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Alguien ha pujado esa misma cantidad antes que tú" };
    }
    return { error: "No se pudo registrar la puja. Inténtalo de nuevo" };
  }

  // Quien puja ve el resultado al momento; los demás, en su siguiente refresco
  revalidatePath("/room/[code]", "page");
  return { error: null };
}

export async function leaveRoom(formData: FormData): Promise<void> {
  await endPresidentSession();
  const roomCode = formData.get("roomCode");
  redirect(typeof roomCode === "string" && ROOM_CODE.test(roomCode) ? `/room/${roomCode}` : "/");
}
