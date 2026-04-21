import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  // Capturamos el "code" que nos envía GitHub en la URL
  const code = searchParams.get('code')
  // Capturamos hacia dónde quiere ir el usuario después (por defecto al dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    // Iniciamos Supabase en modo servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Ignoramos errores si se ejecuta desde un Server Component
            }
          },
        },
      }
    )
    
    // ¡Aquí ocurre la magia! Cambiamos el código por una sesión segura
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si todo va bien, redirigimos limpiamente al dashboard sin el "code" en la URL
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, lo devolvemos al login
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}