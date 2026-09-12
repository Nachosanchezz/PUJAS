"use client";

import { useEffect, useState } from "react";

type CountdownProps = {
  endsAt: string | null;
  pausedRemainingMs: number | null;
  serverNow: string;
};

export function Countdown({ endsAt, pausedRemainingMs, serverNow }: CountdownProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;

    // Diferencia entre el reloj del servidor y el del dispositivo: así todos
    // ven el mismo contador aunque el móvil tenga la hora mal puesta.
    const offset = new Date(serverNow).getTime() - Date.now();
    const end = new Date(endsAt).getTime();
    const tick = () => setRemainingMs(Math.max(0, end - (Date.now() + offset)));

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [endsAt, serverNow]);

  const paused = pausedRemainingMs !== null;
  const ms = paused ? pausedRemainingMs : remainingMs;
  const seconds = ms === null ? null : Math.ceil(ms / 1000);
  const urgent = !paused && seconds !== null && seconds <= 5;

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        data-testid="countdown"
        className={`text-7xl font-black tabular-nums transition-colors ${urgent ? "text-red-500" : ""}`}
      >
        {seconds ?? "–"}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
        {paused ? "En pausa" : seconds === 0 ? "¡Tiempo!" : "segundos"}
      </span>
    </div>
  );
}
