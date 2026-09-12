import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Falta ADMIN_PASSWORD en .env.local.");
  }
  return password;
}

// El valor de la cookie es una firma derivada de la contraseña: no se puede
// falsificar sin conocerla, y cambiar la contraseña cierra todas las sesiones.
function sessionToken(): string {
  return createHmac("sha256", getAdminPassword()).update("admin-session").digest("hex");
}

// Comparación en tiempo constante: el tiempo de respuesta no da pistas
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function isValidAdminPassword(candidate: string): boolean {
  return safeEqual(candidate, getAdminPassword());
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token !== undefined && safeEqual(token, sessionToken());
}

// Llamar al principio de CADA página y CADA Server Action del panel
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

export async function startAdminSession(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
