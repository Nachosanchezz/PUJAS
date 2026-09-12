import Form from "next/form";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-emerald-500/40 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-500">
        Mercado de fichajes
      </span>

      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
        Subasta de la liga de fútbol sala
      </h1>

      <p className="max-w-md text-lg text-foreground/70">
        Cinco equipos, un presupuesto limitado y pujas en directo desde el
        móvil.
      </p>

      <Form action="/room" className="flex w-full max-w-xs gap-2">
        <input
          name="code"
          required
          maxLength={6}
          placeholder="Código de sala"
          aria-label="Código de sala"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-center font-mono text-base uppercase tracking-widest outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          Entrar
        </button>
      </Form>

      <Link href="/admin" className="text-sm text-foreground/50 hover:text-foreground">
        Acceso administrador
      </Link>
    </main>
  );
}
