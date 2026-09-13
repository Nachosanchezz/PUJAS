import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">No encontramos esta página</h1>
      <p className="text-foreground/70">Si buscas una sala, revisa el código o el enlace.</p>
      <Link href="/" className="text-brand hover:text-brand-light">
        Volver al inicio
      </Link>
    </main>
  );
}
