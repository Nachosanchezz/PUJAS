"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Red de seguridad: si el canal en tiempo real falla, refrescamos cada 3 s
const FALLBACK_POLL_MS = 3000;

// Escucha los avisos de la sala (Supabase Realtime) y vuelve a pedir los datos
// de la página en cuanto algo cambia: una puja, un jugador nuevo, una pausa...
export function RealtimeRefresh({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    let active = true;
    let pending: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;

    // Varios avisos seguidos (una ráfaga de pujas) se agrupan en una recarga
    const refresh = () => {
      clearTimeout(pending);
      pending = setTimeout(() => router.refresh(), 50);
    };
    const startPolling = () => {
      poll ??= setInterval(refresh, FALLBACK_POLL_MS);
    };

    const channel = supabase.channel(`room:${roomId}`, { config: { private: true } });
    channel.on("broadcast", { event: "changed" }, refresh);

    supabase.realtime
      .setAuth()
      .then(() => {
        channel.subscribe((state) => {
          if (!active) return;
          setStatus(state);
          if (state === "SUBSCRIBED") {
            clearInterval(poll);
            poll = undefined;
            // Al (re)conectar nos ponemos al día por si nos perdimos algún aviso
            refresh();
          } else {
            startPolling();
          }
        });
      })
      .catch(() => {
        if (active) startPolling();
      });

    // Los móviles cortan la conexión en segundo plano: al volver, actualizamos
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearTimeout(pending);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [roomId, router]);

  // Invisible: solo sirve para diagnosticar el estado de la conexión
  return <span hidden data-testid="realtime-status" data-status={status} />;
}
