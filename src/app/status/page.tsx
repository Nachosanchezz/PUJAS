import type { Metadata } from "next";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Estado del sistema",
};

const TABLES = ["rooms", "teams", "players", "auctions", "bids"] as const;

type TableName = (typeof TABLES)[number];

type TableCheck = {
  table: TableName;
  ok: boolean;
  detail: string;
};

async function checkTable(table: TableName): Promise<TableCheck> {
  // GET y no HEAD: una respuesta HEAD no trae cuerpo, así que un 404
  // (tabla inexistente) llegaría sin mensaje de error y parecería correcto.
  const { count, error, status } = await supabase
    .from(table)
    .select("*", { count: "exact" })
    .limit(1);

  if (error || status >= 400) {
    return { table, ok: false, detail: error?.message ?? `HTTP ${status}` };
  }
  return { table, ok: true, detail: `${count ?? 0} filas visibles` };
}

export default async function StatusPage() {
  // Comprobar en cada visita, no una sola vez al compilar
  await connection();

  const checks = await Promise.all(TABLES.map(checkTable));
  const allOk = checks.every((check) => check.ok);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Estado del sistema</h1>

      <p
        className={`rounded-lg px-4 py-3 font-semibold ${
          allOk ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        }`}
      >
        {allOk ? "Conectado a Supabase" : "Hay problemas con la base de datos"}
      </p>

      <ul className="flex flex-col gap-2">
        {checks.map((check) => (
          <li
            key={check.table}
            className="flex flex-col gap-1 rounded-lg border border-foreground/10 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono">{check.table}</span>
              <span className={check.ok ? "text-emerald-500" : "text-red-500"}>
                {check.ok ? "OK" : "Error"}
              </span>
            </div>
            <span className="text-sm text-foreground/60">{check.detail}</span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-foreground/60">
        Con RLS activado y sin políticas, la clave pública no ve ninguna fila.
        Es lo esperado hasta que definamos los permisos.
      </p>
    </main>
  );
}
