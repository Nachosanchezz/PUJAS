import type { Metadata } from "next";
import Link from "next/link";
import { createRoom } from "@/app/admin/actions";
import { ActionForm } from "@/components/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { TextField } from "@/components/ui/text-field";
import { requireAdmin } from "@/lib/admin-auth";
import { ROOM_STATUS_LABEL } from "@/lib/labels";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Panel de administración",
};

export default async function AdminPage() {
  await requireAdmin();

  const { data: rooms, error } = await supabaseAdmin
    .from("rooms")
    .select("id, code, name, status")
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudieron cargar las salas");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
      <AdminHeader title="Panel de administración" />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Nueva sala</h2>
        <ActionForm action={createRoom} submitLabel="Crear sala">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Nombre" name="name" required maxLength={60} placeholder="Draft 2026" />
            <TextField
              label="Presupuesto por equipo (M€)"
              name="initialBudget"
              type="number"
              min={1}
              max={10000}
              defaultValue={200}
              required
            />
          </div>
        </ActionForm>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Salas</h2>
        {rooms.length === 0 ? (
          <p className="text-foreground/60">Todavía no hay ninguna sala.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/admin/rooms/${room.code}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 px-4 py-3 transition-colors hover:border-brand/50"
                >
                  <span className="font-semibold">{room.name}</span>
                  <span className="flex items-center gap-3 text-sm text-foreground/60">
                    <span className="font-mono">{room.code}</span>
                    {ROOM_STATUS_LABEL[room.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
