import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo para `npm run dev`: deja que los móviles de la red local (casa o
  // punto de acceso del iPhone) usen el servidor de desarrollo. Sin esto,
  // Next.js bloquea su JavaScript y los botones no funcionan en el móvil.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.20.10.*", "*.local"],
};

export default nextConfig;
