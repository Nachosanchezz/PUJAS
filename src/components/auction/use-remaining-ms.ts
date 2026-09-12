"use client";

import { useEffect, useState } from "react";

// Milisegundos que quedan hasta `endsAt`, actualizados 4 veces por segundo.
// Devuelve null hasta el primer cálculo (y si no hay hora de fin).
export function useRemainingMs(endsAt: string | null, serverNow: string): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;

    // Diferencia entre el reloj del servidor y el del dispositivo: así todos
    // ven el mismo tiempo aunque el móvil tenga la hora mal puesta.
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

  return remainingMs;
}
