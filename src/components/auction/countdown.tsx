"use client";

import { useRemainingMs } from "@/components/auction/use-remaining-ms";

type CountdownProps = {
  endsAt: string | null;
  pausedRemainingMs: number | null;
  serverNow: string;
};

export function Countdown({ endsAt, pausedRemainingMs, serverNow }: CountdownProps) {
  const remainingMs = useRemainingMs(endsAt, serverNow);

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
