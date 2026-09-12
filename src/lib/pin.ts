import { randomInt } from "node:crypto";

// randomInt usa el generador criptográfico del sistema, no Math.random()
export function generatePin(): string {
  return String(randomInt(10000)).padStart(4, "0");
}
