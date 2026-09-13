import type { NextConfig } from "next";

// Cabeceras de seguridad que se envían con todas las páginas
const securityHeaders = [
  // Nadie puede meter la web dentro de un iframe de otra página
  // (evita que te engañen para pulsar "pujar" sin darte cuenta)
  { key: "X-Frame-Options", value: "DENY" },
  // El navegador no "adivina" el tipo de un archivo: usa el que dice el servidor
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir hacia otra web no se envía la dirección completa de la sala
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La web no usa cámara, micrófono ni ubicación
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // No anunciamos qué tecnología usa el servidor
  poweredByHeader: false,
  // Solo para `npm run dev`: deja que los móviles de la red local (casa o
  // punto de acceso del iPhone) usen el servidor de desarrollo. Sin esto,
  // Next.js bloquea su JavaScript y los botones no funcionan en el móvil.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.20.10.*", "*.local"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
