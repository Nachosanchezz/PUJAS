import { redirect } from "next/navigation";

// /room?code=abc123 -> /room/ABC123 (lo usa el formulario de la portada)
export default async function RoomCodeRedirect({ searchParams }: PageProps<"/room">) {
  const { code } = await searchParams;
  const value = typeof code === "string" ? code.trim().toUpperCase() : "";
  redirect(/^[A-Z0-9]{6}$/.test(value) ? `/room/${value}` : "/");
}
