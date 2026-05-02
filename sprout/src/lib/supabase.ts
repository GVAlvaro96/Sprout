import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Este cliente sabrá sincronizar de forma segura las sesiones con las cookies del navegador
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)