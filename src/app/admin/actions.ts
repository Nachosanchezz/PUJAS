"use server";

// Server Actions del panel. Son endpoints públicos: cualquiera podría
// llamarlas, así que TODAS empiezan con requireAdmin() y validan los datos.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/action-form";
import type { ImportState } from "@/components/admin/player-import";
import {
  endAdminSession,
  isValidAdminPassword,
  requireAdmin,
  startAdminSession,
} from "@/lib/admin-auth";
import { generatePin } from "@/lib/pin";
import { normalizeName, parsePlayerList } from "@/lib/player-list";
import { generateRoomCode } from "@/lib/room-code";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { firstIssue, RAISED_EXCEPTION, UNIQUE_VIOLATION } from "@/lib/validation";

const ROOM_PAGE = "/admin/rooms/[code]";

// ---------- Sesión ----------

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !isValidAdminPassword(password)) {
    // Frena a quien intente adivinar la contraseña probando muchas seguidas
    await new Promise((resolve) => setTimeout(resolve, 1000));
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

const rulesSchema = z
  .object({
    roomId: z.uuid(),
    auctionSeconds: z.coerce
      .number()
      .int("Usa un número entero de segundos")
      .min(5, "Cada jugador debe durar al menos 5 segundos")
      .max(300, "Cada jugador puede durar como mucho 300 segundos"),
    antiSnipeSeconds: z.coerce
      .number()
      .int("Usa un número entero de segundos")
      .min(0, "No puede ser negativo"),
  })
  .refine((rules) => rules.antiSnipeSeconds <= rules.auctionSeconds, {
    error: "Al pujar, el contador no puede volver a más segundos de los que dura cada jugador",
  });

// Tiempos de la subasta. La duración se aplica al siguiente jugador que salga;
// el reinicio al pujar, a partir de la siguiente puja.
export async function updateRoomRules(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = rulesSchema.safeParse({
    roomId: formData.get("roomId"),
    auctionSeconds: formData.get("auctionSeconds"),
    antiSnipeSeconds: formData.get("antiSnipeSeconds"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { error } = await supabaseAdmin
    .from("rooms")
    .update({
      auction_seconds: parsed.data.auctionSeconds,
      anti_snipe_seconds: parsed.data.antiSnipeSeconds,
    })
    .eq("id", parsed.data.roomId);

  if (error) return { error: "No se pudieron guardar las reglas" };

  revalidatePath(ROOM_PAGE, "page");
  return { error: null };
}

// Sorteo del orden de salida: una sola vez y antes de empezar
export async function drawAuctionOrder(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z.uuid().safeParse(formData.get("roomId"));
  if (!parsed.success) return { error: "Datos no válidos" };

  const { error } = await supabaseAdmin.rpc("draw_auction_order", { p_room_id: parsed.data });
  if (error) {
    return { error: error.code === RAISED_EXCEPTION ? error.message : "No se pudo sortear el orden" };
  }

  revalidatePath(ROOM_PAGE, "page");
  return { error: null };
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
    p_pin: generatePin(),
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

export async function regenerateTeamPin(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = z.uuid().safeParse(formData.get("teamId"));
  if (!parsed.success) return;

  // Un PIN nuevo también cierra la sesión de quien entró con el anterior
  await supabaseAdmin.from("team_access").upsert({
    team_id: parsed.data,
    pin: generatePin(),
    failed_attempts: 0,
    locked_until: null,
  });

  revalidatePath(ROOM_PAGE, "page");
}

const teamBudgetSchema = z.object({
  teamId: z.uuid(),
  budget: z.coerce
    .number()
    .int("El presupuesto debe ser un número entero")
    .min(1, "El presupuesto mínimo es 1 M€")
    .max(10000, "El presupuesto máximo es 10.000 M€"),
});

// Presupuesto inicial de un equipo (p. ej. dinero extra para equilibrar).
// Solo antes de empezar: con la subasta en marcha cambiaría las reglas a mitad.
export async function updateTeamBudget(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = teamBudgetSchema.safeParse({
    teamId: formData.get("teamId"),
    budget: formData.get("budget"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("room:rooms(status)")
    .eq("id", parsed.data.teamId)
    .maybeSingle();
  if (teamError || !team) return { error: "No se encontró el equipo" };
  if (team.room?.status !== "setup") {
    return { error: "El presupuesto solo se puede cambiar antes de empezar la subasta" };
  }

  const { error } = await supabaseAdmin
    .from("teams")
    .update({ initial_budget: parsed.data.budget })
    .eq("id", parsed.data.teamId);
  if (error) return { error: "No se pudo guardar el presupuesto" };

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

const MAX_IMPORT = 200;

const importSchema = z.object({
  roomId: z.uuid(),
  list: z.string().max(20000, "La lista es demasiado larga"),
});

export async function importPlayers(_state: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();

  const parsed = importSchema.safeParse({
    roomId: formData.get("roomId"),
    list: formData.get("list") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error), message: null };

  // El servidor vuelve a interpretar la lista: nunca se fía de la vista previa
  const { players } = parsePlayerList(parsed.data.list);
  if (players.length === 0) return { error: "No hay ningún jugador en la lista", message: null };
  if (players.length > MAX_IMPORT) {
    return { error: `Máximo ${MAX_IMPORT} jugadores por importación`, message: null };
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("players")
    .select("name")
    .eq("room_id", parsed.data.roomId);
  if (existingError) return { error: "No se pudo leer la sala", message: null };

  const existingNames = new Set(existing.map((player) => normalizeName(player.name)));
  const fresh = players.filter((player) => !existingNames.has(normalizeName(player.name)));
  const skipped = players.length - fresh.length;

  if (fresh.length === 0) {
    return { error: "Todos los jugadores de la lista ya están en la sala", message: null };
  }

  // Un solo insert con todas las filas: o entran todos o ninguno
  const { error } = await supabaseAdmin.from("players").insert(
    fresh.map((player) => ({
      room_id: parsed.data.roomId,
      name: player.name,
      position: player.position,
    })),
  );

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Algún jugador ya existe en la sala. Recarga la página y vuelve a intentarlo", message: null };
    }
    return { error: "No se pudieron importar los jugadores", message: null };
  }

  revalidatePath(ROOM_PAGE, "page");
  const note = skipped > 0 ? ` (${skipped} ya estaban en la sala)` : "";
  return { error: null, message: `Importados ${fresh.length} jugadores${note}` };
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
