"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { placeBid } from "@/app/room/actions";
import type { FormState } from "@/components/action-form";
import { useLiveAuction } from "@/components/auction/use-live-auction";
import { useRemainingMs } from "@/components/auction/use-remaining-ms";
import { formatMillions } from "@/lib/format";
import type { AuctionView } from "@/lib/room-data";

const INCREMENTS = [1, 5, 10];

// ¿Parece un error de dedo (150 en vez de 15)? Pedimos confirmación si la puja es
// a la vez 30 M€ más que la actual y el doble o más. Abrir con 23 M€ no pregunta.
function looksLikeTypo(amount: number, current: number): boolean {
  return amount >= Math.max(current + 30, current * 2);
}

type BidPanelProps = {
  auction: AuctionView;
  myTeamId: string;
  maxBid: number;
  slotsLeft: number;
};

const initialState: FormState = { error: null };

export function BidPanel({ auction, myTeamId, maxBid, slotsLeft }: BidPanelProps) {
  const [state, formAction, pending] = useActionState(placeBid, initialState);
  const [custom, setCustom] = useState("");
  const live = useLiveAuction(auction);
  const remainingMs = useRemainingMs(live.endsAt, live.serverNow);
  const isLeading = live.leadingTeamId === myTeamId;

  // Si todavía no hay pujas se parte de 0 (+5 = 5 M€), sin bajar del precio de salida
  const base = live.currentPrice ?? 0;
  const minNext = Math.max(base + 1, live.startingPrice);
  const customAmount = Number(custom);
  const customValid = custom !== "" && Number.isInteger(customAmount) && customAmount >= minNext && customAmount <= maxBid;

  let notice: string | null = null;
  if (live.status === "paused") notice = "Subasta en pausa";
  else if (live.status !== "running") notice = "Subasta cerrada";
  else if (remainingMs === 0) notice = "Se ha acabado el tiempo";
  else if (slotsLeft <= 0) notice = "Tu plantilla está completa";
  else if (isLeading) notice = "Vas ganando";

  // Puja escrita a mano: se envía igual que un botón, pero con confirmación si el salto es grande
  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customValid) return;
    if (
      looksLikeTypo(customAmount, base) &&
      !window.confirm(
        `¿Seguro que quieres pujar ${formatMillions(customAmount)}? Son ${formatMillions(customAmount - base)} más que la puja actual.`,
      )
    ) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
    setCustom("");
  }

  const resetRule =
    live.antiSnipeSeconds <= 0
      ? "Pujar no alarga el tiempo"
      : live.antiSnipeSeconds * 1000 >= live.durationMs
        ? `Cada puja vuelve a poner el contador a ${live.antiSnipeSeconds} s`
        : `Si alguien puja con menos de ${live.antiSnipeSeconds} s, el contador vuelve a ${live.antiSnipeSeconds} s`;

  return (
    <div className="flex flex-col gap-3">
      {notice ? (
        <p
          className={`rounded-2xl py-6 text-center font-display text-3xl font-extrabold italic uppercase ${
            notice === "Vas ganando"
              ? "bg-brand/15 text-brand ring-1 ring-brand/40"
              : "bg-foreground/5 text-foreground/60"
          }`}
        >
          {notice}
        </p>
      ) : (
        <>
          {/* Cada botón envía su propia cantidad: el botón pulsado viaja en el formulario */}
          <form action={formAction} className="grid grid-cols-3 gap-3">
            <input type="hidden" name="auctionId" value={live.id} />
            {INCREMENTS.map((increment) => {
              const amount = Math.max(base + increment, live.startingPrice);
              return (
                <button
                  key={increment}
                  type="submit"
                  name="amount"
                  value={amount}
                  disabled={pending || amount > maxBid}
                  aria-label={`Pujar ${formatMillions(amount)}`}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-brand py-5 text-black shadow-[0_10px_30px_-12px] shadow-brand transition active:scale-95 hover:bg-brand-light disabled:bg-foreground/10 disabled:text-foreground/30 disabled:shadow-none"
                >
                  <span className="font-display text-5xl font-black italic leading-none">+{increment}</span>
                  <span className="text-xs font-bold">{formatMillions(amount)}</span>
                </button>
              );
            })}
          </form>

          <form onSubmit={submitCustom} className="flex flex-col gap-1">
            <input type="hidden" name="auctionId" value={live.id} />
            <div className="flex gap-2">
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                min={minNext}
                max={maxBid}
                step={1}
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                placeholder={`Otra cantidad (mín. ${minNext})`}
                aria-label="Otra cantidad en millones"
                className="min-w-0 flex-1 rounded-2xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-base outline-none transition-colors focus:border-brand"
              />
              <button
                type="submit"
                disabled={pending || !customValid}
                className="shrink-0 rounded-2xl border-2 border-brand px-4 font-display text-xl font-extrabold italic uppercase text-brand transition-colors hover:bg-brand/10 disabled:border-foreground/15 disabled:text-foreground/30"
              >
                {customValid ? `Pujar ${formatMillions(customAmount)}` : "Pujar"}
              </button>
            </div>
            {custom !== "" && !customValid && (
              <p className="text-xs text-alert">
                Escribe un número entero entre {minNext} y {maxBid} M€
              </p>
            )}
          </form>
        </>
      )}

      <p className="text-center text-sm text-foreground/60">
        Tu puja máxima: <strong className="text-foreground">{formatMillions(maxBid)}</strong>
        <span className="block text-xs text-foreground/40">{resetRule}</span>
      </p>

      {state.error && (
        <p role="alert" className="text-center text-sm font-semibold text-alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
