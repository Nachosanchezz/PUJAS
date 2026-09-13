"use client";

import {
  startTransition,
  useActionState,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { normalizeName, parsePlayerList } from "@/lib/player-list";

export type ImportState = { error: string | null; message: string | null };

type PlayerImportProps = {
  roomId: string;
  existingNames: string[];
  action: (state: ImportState, formData: FormData) => Promise<ImportState>;
};

const initialState: ImportState = { error: null, message: null };

const PLACEHOLDER = "Nacho Sánchez, Ala\nMario García\nPablo López (Portero)";

export function PlayerImport({ roomId, existingNames, action }: PlayerImportProps) {
  const [text, setText] = useState("");

  const [state, formAction, pending] = useActionState(
    async (previous: ImportState, formData: FormData): Promise<ImportState> => {
      const result = await action(previous, formData);
      if (!result.error) setText("");
      return result;
    },
    initialState,
  );

  // La vista previa se recalcula al escribir, sin llamar al servidor
  const preview = useMemo(() => {
    const existing = new Set(existingNames.map(normalizeName));
    const list = parsePlayerList(text);
    return {
      ...list,
      fresh: list.players.filter((player) => !existing.has(normalizeName(player.name))),
      alreadyInRoom: list.players.filter((player) => existing.has(normalizeName(player.name))),
    };
  }, [text, existingNames]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setText(await file.text());
    event.target.value = "";
  }

  // Envío manual (como en ActionForm) para que un error no vacíe la lista
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="roomId" value={roomId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground/70">
          Pega la lista: un jugador por línea. La posición es opcional (detrás de una coma o entre
          paréntesis).
        </span>
        <textarea
          name="list"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          placeholder={PLACEHOLDER}
          className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-base outline-none transition-colors focus:border-brand"
        />
      </label>

      <label className="flex flex-wrap items-center gap-2 text-sm text-foreground/60">
        O carga un archivo .csv:
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={handleFile}
          className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-foreground/10 file:px-3 file:py-1 file:text-foreground"
        />
      </label>

      {text.trim() && (
        <div className="flex flex-col gap-2 rounded-lg border border-foreground/10 p-3 text-sm">
          <p className="font-semibold">{preview.fresh.length} jugadores nuevos</p>
          {preview.fresh.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {preview.fresh.map((player) => (
                <li key={normalizeName(player.name)} className="rounded-full bg-foreground/5 px-3 py-1">
                  {player.name}
                  {player.position && <span className="text-foreground/50"> · {player.position}</span>}
                </li>
              ))}
            </ul>
          )}
          {preview.alreadyInRoom.length > 0 && (
            <p className="text-gold">
              Ya están en la sala, se omitirán:{" "}
              {preview.alreadyInRoom.map((player) => player.name).join(", ")}
            </p>
          )}
          {preview.duplicates.length > 0 && (
            <p className="text-gold">
              Repetidos en la lista, se importan una sola vez: {preview.duplicates.join(", ")}
            </p>
          )}
          {preview.invalid.length > 0 && (
            <p className="text-alert">Líneas no válidas, se ignoran: {preview.invalid.join(" · ")}</p>
          )}
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-brand">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || preview.fresh.length === 0}
        className="rounded-lg bg-brand px-4 py-2 font-semibold text-black transition-colors hover:bg-brand-light disabled:opacity-50"
      >
        {pending ? "Importando…" : `Importar ${preview.fresh.length} jugadores`}
      </button>
    </form>
  );
}
