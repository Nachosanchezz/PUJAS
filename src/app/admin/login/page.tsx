import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions";
import { ActionForm } from "@/components/action-form";
import { TextField } from "@/components/ui/text-field";
import { isAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Acceso administrador",
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Acceso administrador</h1>
      <ActionForm action={login} submitLabel="Entrar">
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </ActionForm>
    </main>
  );
}
