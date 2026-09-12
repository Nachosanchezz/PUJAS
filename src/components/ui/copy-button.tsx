"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El portapapeles solo funciona en https o localhost: si no, lo mostramos
      window.prompt("Copia el enlace:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg bg-foreground/10 px-3 py-1 text-sm font-semibold transition-colors hover:bg-foreground/20"
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
