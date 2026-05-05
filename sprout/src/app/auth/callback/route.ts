import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // 1. Obtenemos la URL base real (Render o localhost)
  // Evitamos que use el puerto 10000 interno
  const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (chunkedCookies) => {
            chunkedCookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 2. Redirección forzada al origen público
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, lo mandamos al login de vuelta al origen correcto
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}