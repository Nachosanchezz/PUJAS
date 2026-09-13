"use client";

import { useRemainingMs } from "@/components/auction/use-remaining-ms";

type CountdownProps = {
  endsAt: string | null;
  pausedRemainingMs: number | null;
  serverNow: string;
  durationMs: number;
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Contador dentro de un anillo que se vacía; rojo y parpadeando al final
export function Countdown({ endsAt, pausedRemainingMs, serverNow, durationMs }: CountdownProps) {
  const remainingMs = useRemainingMs(endsAt, serverNow);

  const paused = pausedRemainingMs !== null;
  const ms = paused ? pausedRemainingMs : remainingMs;
  const seconds = ms === null ? null : Math.ceil(ms / 1000);
  const urgent = !paused && seconds !== null && seconds <= 5;
  const fraction = ms === null ? 1 : Math.min(1, Math.max(0, ms / durationMs));
  const ringColor = urgent ? "text-alert" : paused ? "text-gold" : "text-brand";

  return (
    <div className="relative flex size-40 items-center justify-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="7" stroke="currentColor" className="text-foreground/10" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={`${ringColor} transition-[stroke-dashoffset] duration-300 ease-linear`}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span
          data-testid="countdown"
          className={`font-display text-7xl font-black italic leading-none tabular-nums ${
            urgent ? "animate-urgent text-alert" : ""
          }`}
        >
          {seconds ?? "–"}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
          {paused ? "En pausa" : seconds === 0 ? "¡Tiempo!" : "segundos"}
        </span>
      </div>
    </div>
  );
}
