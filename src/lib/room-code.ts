import { randomInt } from "node:crypto";

// Sin 0/O ni 1/I para que el código se pueda dictar sin confusiones
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
