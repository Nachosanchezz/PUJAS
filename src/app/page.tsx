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
    </main>
  );
}
