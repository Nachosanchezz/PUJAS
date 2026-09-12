"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import { endPresidentSession, startPresidentSession } from "@/lib/president-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { firstIssue } from "@/lib/validation";

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

export async function leaveRoom(formData: FormData): Promise<void> {
  await endPresidentSession();
  const roomCode = formData.get("roomCode");
  redirect(typeof roomCode === "string" && ROOM_CODE.test(roomCode) ? `/room/${roomCode}` : "/");
}
