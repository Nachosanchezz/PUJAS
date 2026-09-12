"use client";

import { useActionState } from "react";
import { placeBid } from "@/app/room/actions";
import type { FormState } from "@/components/action-form";
import { useRemainingMs } from "@/components/auction/use-remaining-ms";
import { formatMillions } from "@/lib/format";
import type { Enums } from "@/types/database";

const INCREMENTS = [1, 5, 10];

type BidPanelProps = {
  roomCode: string;
  auctionId: string;
  status: Enums<"auction_status">;
  startingPrice: number;
  currentPrice: number | null;
  endsAt: string | null;
  serverNow: string;
  isLeading: boolean;
  maxBid: number;
  slotsLeft: number;
};

const initialState: FormState = { error: null };

export function BidPanel({
  roomCode,
  auctionId,
  status,
  startingPrice,
  currentPrice,
  endsAt,
  serverNow,
  isLeading,
  maxBid,
  slotsLeft,
}: BidPanelProps) {
  const [state, formAction, pending] = useActionState(placeBid, initialState);
  const remainingMs = useRemainingMs(endsAt, serverNow);

  // Si todavía no hay pujas se parte de 0 (+5 = 5 M€), sin bajar del precio de salida
  const base = currentPrice ?? 0;

  let notice: string | null = null;
  if (status === "paused") notice = "Subasta en pausa";
  else if (remainingMs === 0) notice = "Se ha acabado el tiempo";
  else if (slotsLeft <= 0) notice = "Tu plantilla está completa";
  else if (isLeading) notice = "Vas ganando";

  return (
    // Cada botón envía su propia cantidad: el botón pulsado viaja en el formulario
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="roomCode" value={roomCode} />
      <input type="hidden" name="auctionId" value={auctionId} />

      {notice ? (
        <p
          className={`rounded-xl py-5 text-center text-lg font-bold ${
            isLeading && notice === "Vas ganando"
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-foreground/5 text-foreground/70"
          }`}
        >
          {notice}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {INCREMENTS.map((increment) => {
            const amount = Math.max(base + increment, startingPrice);
            return (
              <button
                key={increment}
                type="submit"
                name="amount"
                value={amount}
                disabled={pending || amount > maxBid}
                aria-label={`Pujar ${formatMillions(amount)}`}
                className="flex flex-col items-center gap-1 rounded-xl bg-emerald-500 py-4 text-black transition-colors hover:bg-emerald-400 active:scale-95 disabled:opacity-30"
              >
                <span className="text-2xl font-black">+{increment}</span>
                <span className="text-xs font-semibold">{formatMillions(amount)}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-foreground/60">
        Tu puja máxima: <strong className="text-foreground">{formatMillions(maxBid)}</strong>
      </p>

      {state.error && (
        <p role="alert" className="text-center text-sm font-semibold text-red-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
