import Link from "next/link";

type Section = "sala" | "directo" | "orden" | "plantillas" | "historial";

const LINKS: { section: Section; label: string; path: string }[] = [
  { section: "sala", label: "Sala", path: "" },
  { section: "directo", label: "Directo", path: "/directo" },
  { section: "orden", label: "Orden", path: "/orden" },
  { section: "plantillas", label: "Plantillas", path: "/plantillas" },
  { section: "historial", label: "Historial", path: "/historial" },
];

type RoomNavProps = {
  code: string;
  current: Section;
  // Los presidentes siguen la subasta desde "Sala", donde pujan;
  // el resto, desde "Directo", donde solo se mira
  president: boolean;
};

// Menú común de las páginas de una sala
export function RoomNav({ code, current, president }: RoomNavProps) {
  const links = LINKS.filter((link) => link.section !== (president ? "directo" : "sala"));

  return (
    <nav aria-label="Secciones de la sala" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active = link.section === current;
        return (
          <Link
            key={link.section}
            href={`/room/${code}${link.path}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              active ? "bg-brand text-black" : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
