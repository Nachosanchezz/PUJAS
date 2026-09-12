// Convierte una lista pegada (Notas, WhatsApp, Excel, un CSV...) en jugadores.
// Es una función pura: la usan la vista previa del navegador y la Server
// Action, que vuelve a interpretar la lista porque no se fía del cliente.

export type ParsedPlayer = {
  name: string;
  position: string | null;
};

export type PlayerList = {
  players: ParsedPlayer[];
  duplicates: string[];
  invalid: string[];
};

export const MAX_NAME_LENGTH = 60;
export const MAX_POSITION_LENGTH = 30;

// Viñetas al principio de la línea: "- ", "* ", "• ", "- [x] ", "1. "...
const LIST_MARKER = /^\s*(?:[-*•]\s*)?(?:\[[ xX]\]\s*)?(?:\d+[.)]\s+)?/;
// Cabecera de un CSV: "name,position", "nombre;posición"...
const HEADER = /^(name|nombre)\s*([,;\t]\s*(position|posici[oó]n))?$/i;

// Para comparar nombres: sin mayúsculas ni espacios de más
export function normalizeName(name: string): string {
  return name.toLocaleLowerCase("es").replace(/\s+/g, " ").trim();
}

function clean(value: string): string {
  return value
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es") + value.slice(1);
}

function parseLine(rawLine: string): ParsedPlayer | null {
  const line = rawLine.replace(LIST_MARKER, "").trim();
  if (!line || HEADER.test(line)) return null;

  let name = line;
  let position = "";

  // "Nombre, Posición" · "Nombre;Posición" · "Nombre<TAB>Posición" (Excel)
  const separated = line.match(/^([^,;\t]*)[,;\t](.*)$/);
  // "Nombre (Posición)"
  const parenthesized = line.match(/^(.*?)\s*\(([^)]*)\)\s*$/);

  if (separated) {
    name = separated[1];
    position = separated[2].split(/[,;\t]/)[0];
  } else if (parenthesized) {
    name = parenthesized[1];
    position = parenthesized[2];
  }

  // "Goyo ?" -> "Goyo"
  name = clean(name).replace(/\s*\?+$/, "");
  position = clean(position);

  return { name, position: position ? capitalize(position) : null };
}

export function parsePlayerList(text: string): PlayerList {
  const players: ParsedPlayer[] = [];
  const duplicates: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const player = parseLine(rawLine);
    if (!player) continue;

    const tooLong =
      player.name.length > MAX_NAME_LENGTH || (player.position?.length ?? 0) > MAX_POSITION_LENGTH;
    if (!player.name || tooLong) {
      invalid.push(rawLine.trim());
      continue;
    }

    const key = normalizeName(player.name);
    if (seen.has(key)) {
      duplicates.push(player.name);
      continue;
    }
    seen.add(key);
    players.push(player);
  }

  return { players, duplicates, invalid };
}
