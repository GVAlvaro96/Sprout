import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'

  // Validar que next es una ruta interna (evitar open redirect)
  if (next.startsWith('http') || next.startsWith('//') || !next.startsWith('/')) {
    next = '/dashboard'
  }

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