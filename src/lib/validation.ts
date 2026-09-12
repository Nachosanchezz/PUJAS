import type { ZodError } from "zod";

// Código de error de PostgreSQL para un valor duplicado (restricción unique)
export const UNIQUE_VIOLATION = "23505";
// Código de los errores que lanzamos con `raise exception` en nuestras funciones SQL
export const RAISED_EXCEPTION = "P0001";

export function firstIssue(error: ZodError): string {
  return error.issues[0]?.message ?? "Datos no válidos";
}
