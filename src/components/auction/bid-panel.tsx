"use client";

import { useActionState } from "react";
import { placeBid } from "@/app/room/actions";
import type { FormState } from "@/components/action-form";
import { useLiveAuction } from "@/components/auction/use-live-auction";
import { useRemainingMs } from "@/components/auction/use-remaining-ms";
import { formatMillions } from "@/lib/format";
import type { AuctionView } from "@/lib/room-data";

const INCREMENTS = [1, 5, 10];

type BidPanelProps = {
  auction: AuctionView;
  myTeamId: string;
  maxBid: number;
  slotsLeft: number;
};

const initialState: FormState = { error: null };

export function BidPanel({ auction, myTeamId, maxBid, slotsLeft }: BidPanelProps) {
  const [state, formAction, pending] = useActionState(placeBid, initialState);
  const live = useLiveAuction(auction);
  const remainingMs = useRemainingMs(live.endsAt, live.serverNow);
  const isLeading = live.leadingTeamId === myTeamId;

  // Si todavía no hay pujas se parte de 0 (+5 = 5 M€), sin bajar del precio de salida
  const base = live.currentPrice ?? 0;

  let notice: string | null = null;
  if (live.status === "paused") notice = "Subasta en pausa";
  else if (live.status !== "running") notice = "Subasta cerrada";
  else if (remainingMs === 0) notice = "Se ha acabado el tiempo";
  else if (slotsLeft <= 0) notice = "Tu plantilla está completa";
  else if (isLeading) notice = "Vas ganando";

  return (
    // Cada botón envía su propia cantidad: el botón pulsado viaja en el formulario
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="auctionId" value={live.id} />

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
        <div className="grid grid-cols-3 gap-3">
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
        </div>
      )}

      <p className="text-center text-sm text-foreground/60">
        Tu puja máxima: <strong className="text-foreground">{formatMillions(maxBid)}</strong>
      </p>

      {state.error && (
        <p role="alert" className="text-center text-sm font-semibold text-alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
