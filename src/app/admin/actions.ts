"use server";

// Server Actions del panel. Son endpoints públicos: cualquiera podría
// llamarlas, así que TODAS empiezan con requireAdmin() y validan los datos.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import {
  endAdminSession,
  isValidAdminPassword,
  requireAdmin,
  startAdminSession,
} from "@/lib/admin-auth";
import { generateRoomCode } from "@/lib/room-code";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROOM_PAGE = "/admin/rooms/[code]";

// Código de error de PostgreSQL para un valor duplicado (restricción unique)
const UNIQUE_VIOLATION = "23505";
// Código de los errores que lanzamos con `raise exception` en nuestras funciones SQL
const RAISED_EXCEPTION = "P0001";

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos no válidos";
}

// ---------- Sesión ----------

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !isValidAdminPassword(password)) {
    return { error: "Contraseña incorrecta" };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

// ---------- Salas ----------

const roomSchema = z.object({
  name: z.string().trim().min(1, "Pon un nombre a la sala").max(60, "Máximo 60 caracteres"),
  initialBudget: z.coerce
    .number()
    .int("El presupuesto debe ser un número entero")
    .min(1, "El presupuesto mínimo es 1 M€")
    .max(10000, "El presupuesto máximo es 10.000 M€"),
});

export async function createRoom(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = roomSchema.safeParse({
    name: formData.get("name"),
    initialBudget: formData.get("initialBudget"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // El código es aleatorio: si coincide con uno existente, probamos otro
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { error } = await supabaseAdmin.from("rooms").insert({
      code,
      name: parsed.data.name,
      initial_budget: parsed.data.initialBudget,
    });

    if (!error) {
      revalidatePath("/admin");
      redirect(`/admin/rooms/${code}`);
    }
    if (error.code !== UNIQUE_VIOLATION) {
      return { error: "No se pudo crear la sala" };
    }
  }
  return { error: "No se pudo generar un código único, inténtalo de nuevo" };
}

// ---------- Equipos ----------

const teamSchema = z.object({
  roomId: z.uuid(),
  name: z.string().trim().min(1, "Pon un nombre al equipo").max(40, "Máximo 40 caracteres"),
  captainName: z
    .string()
    .trim()
    .min(1, "Indica quién es el presidente")
    .max(60, "Máximo 60 caracteres"),
});

export async function createTeam(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = teamSchema.safeParse({
    roomId: formData.get("roomId"),
    name: formData.get("name"),
    captainName: formData.get("captainName"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { error } = await supabaseAdmin.rpc("create_team", {
    p_room_id: parsed.data.roomId,
    p_name: parsed.data.name,
    p_captain_name: parsed.data.captainName,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Ya existe un equipo o un jugador con ese nombre" };
    }
    if (error.code === RAISED_EXCEPTION) return { error: error.message };
    return { error: "No se pudo crear el equipo" };
  }

  revalidatePath(ROOM_PAGE, "page");
  return { error: null };
}

// ---------- Jugadores ----------

const playerSchema = z.object({
  roomId: z.uuid(),
  name: z.string().trim().min(1, "Pon el nombre del jugador").max(60, "Máximo 60 caracteres"),
  position: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .transform((value) => value || null),
});

export async function createPlayer(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = playerSchema.safeParse({
    roomId: formData.get("roomId"),
    name: formData.get("name"),
    position: formData.get("position") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { error } = await supabaseAdmin.from("players").insert({
    room_id: parsed.data.roomId,
    name: parsed.data.name,
    position: parsed.data.position,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Ya existe un jugador con ese nombre" };
    }
    return { error: "No se pudo crear el jugador" };
  }

  revalidatePath(ROOM_PAGE, "page");
  return { error: null };
}

export async function deletePlayer(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = z.uuid().safeParse(formData.get("playerId"));
  if (!parsed.success) return;

  // Solo se pueden borrar jugadores sin vender que no sean capitanes
  await supabaseAdmin
    .from("players")
    .delete()
    .eq("id", parsed.data)
    .eq("status", "available")
    .eq("is_captain", false);

  revalidatePath(ROOM_PAGE, "page");
}
