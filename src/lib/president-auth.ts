import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const COOKIE_NAME = "president_session";
const SESSION_DAYS = 7;

export type PresidentSession = {
  teamId: string;
  teamName: string;
  roomId: string;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en .env.local.");
  }
  return secret;
}

// La firma incluye el PIN: si el admin cambia el PIN de un equipo,
// las sesiones abiertas con el PIN anterior dejan de ser válidas.
function sign(teamId: string, pin: string): string {
  return createHmac("sha256", getSessionSecret()).update(`${teamId}:${pin}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

// El presidente de la cookie, si su firma es válida (en cualquier sala).
// Para pujar basta con esto: place_bid ya comprueba que el equipo es de la sala.
export async function getCurrentPresident(): Promise<PresidentSession | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  const [teamId, signature] = value?.split(".") ?? [];
  if (!signature || !z.uuid().safeParse(teamId).success) return null;

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, name, room_id, team_access(pin)")
    .eq("id", teamId)
    .maybeSingle();

  if (!team?.team_access) return null;
  if (!safeEqual(signature, sign(team.id, team.team_access.pin))) return null;

  return { teamId: team.id, teamName: team.name, roomId: team.room_id };
}

// El presidente de la cookie, solo si es de esta sala
export async function getPresidentSession(roomId: string): Promise<PresidentSession | null> {
  const session = await getCurrentPresident();
  return session?.roomId === roomId ? session : null;
}

export async function startPresidentSession(teamId: string, pin: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, `${teamId}.${sign(teamId, pin)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function endPresidentSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
