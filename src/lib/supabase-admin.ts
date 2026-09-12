import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.");
}

// Cliente con la secret key: se salta el RLS, así que SOLO puede usarse en el
// servidor. `server-only` rompe la compilación si un componente de cliente lo importa.
export const supabaseAdmin = createClient<Database>(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
