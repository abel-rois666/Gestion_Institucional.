
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

// VALORES DE RESPALDO (FALLBACK)
// Se usan si las variables de entorno no se cargan correctamente por el bundler.
const FALLBACK_URL = "https://uvfmqipekdqsfihurcve.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Zm1xaXBla2Rxc2ZpaHVyY3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTAxNjMsImV4cCI6MjA4NDA2NjE2M30.79BE4ZBpW8bRspI2tDCOXxNQxbqyZbdMFae9bukhUXM";

const getEnvVar = (key: string): string => {
  try {
    // Intento 1: Vite
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}

  try {
    // Intento 2: Process (Node/Legacy)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return '';
};

const envUrl = getEnvVar('VITE_SUPABASE_URL');
const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Usamos la variable de entorno si existe, si no, usamos el fallback directo
const supabaseUrl = envUrl || FALLBACK_URL;
const supabaseAnonKey = envKey || FALLBACK_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https')
);

if (isSupabaseConfigured) {
  console.log("UniGestor: Conexión Supabase Activa (" + supabaseUrl + ")");
} else {
  console.warn("UniGestor: Credenciales Supabase faltantes.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
