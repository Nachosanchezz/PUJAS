import Form from "next/form";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <span className="rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-brand">
        Mercado de fichajes
      </span>

      <h1 className="max-w-3xl text-6xl leading-[0.9] sm:text-8xl">
        Subasta de la liga <span className="text-brand">de fútbol sala</span>
      </h1>

      <p className="max-w-md text-lg text-foreground/70">
        Cinco equipos, un presupuesto limitado y pujas en directo desde el móvil.
      </p>

      <Form action="/room" className="flex w-full max-w-xs gap-2">
        <input
          name="code"
          required
          maxLength={6}
          placeholder="Código de sala"
          aria-label="Código de sala"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-3 text-center font-mono text-base uppercase tracking-widest outline-none transition-colors focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand px-5 font-display text-xl font-extrabold italic uppercase text-black transition-colors hover:bg-brand-light"
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
