
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

// Fix: Use process.env to access environment variables because import.meta.env is not recognized in this TypeScript environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Verificamos si las variables están presentes
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn(
    "UniGestor: Credenciales de Supabase no detectadas en el entorno. " +
    "Asegúrate de tener un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. " +
    "Cargando modo de datos locales (Mock)."
  );
}

// Inicializamos el cliente. Si no hay credenciales, usamos placeholders 
// para evitar que la app explote, pero isSupabaseConfigured controlará la lógica de fallback.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
