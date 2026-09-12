import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copia .env.example como .env.local y rellénalo.",
  );
}

// Cliente con la clave pública: vale para el servidor y para el navegador.
// Lo que puede leer o escribir lo deciden las políticas RLS de la base de datos.
// <Database> son los tipos generados con `npm run db:types`.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
