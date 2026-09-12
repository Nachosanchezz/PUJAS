import Link from "next/link";
import { logout } from "@/app/admin/actions";

type AdminHeaderProps = {
  title: string;
  backHref?: string;
};

export function AdminHeader({ title, backHref }: AdminHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        {backHref && (
          <Link href={backHref} className="text-sm text-foreground/60 hover:text-foreground">
            ← Volver
          </Link>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <form action={logout}>
        <button type="submit" className="text-sm text-foreground/60 hover:text-foreground">
          Cerrar sesión
        </button>
      </form>
    </header>
  );
}
