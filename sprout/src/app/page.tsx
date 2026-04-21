import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  // Comprobamos si el usuario ya tiene una sesión activa
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-bold tracking-tight text-green-700">Sprout</span>
        </div>
        
        <div>
          {user ? (
            <Link 
              href="/dashboard" 
              className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
            >
              Ir al Dashboard
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900 text-sm font-semibold flex items-center gap-2 border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition-all"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
          No dejes que tus ideas <br /> se marchiten.
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Sprout es la incubadora minimalista para desarrolladores. Captura ideas de proyectos, gestiónalas en un tablero Kanban y conviértelas en repositorios reales con un clic.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href={user ? "/seed" : "/login"} 
            className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-1"
          >
            Plantar una idea 🌱
          </Link>
          <Link 
            href="#features" 
            className="w-full sm:w-auto bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
          >
            Saber más
          </Link>
        </div>
      </main>

      {/* FEATURES SECTION (PRESENTACIÓN) */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold">Captura Ultrarápida</h3>
            <p className="text-gray-500 leading-relaxed">
              Diseñado para el móvil. Anota el stack y la idea antes de que se te olvide mientras vas en el bus.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-bold">Flujo Kanban</h3>
            <p className="text-gray-500 leading-relaxed">
              Organiza tus proyectos según su madurez. De una simple idea a un esqueleto funcional.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
              <span className="text-2xl">🐙</span>
            </div>
            <h3 className="text-xl font-bold">Integración GitHub</h3>
            <p className="text-gray-500 leading-relaxed">
              Próximamente: Crea el repositorio y el esqueleto del código automáticamente desde el tablero.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Sprout - Construido para desarrolladores inquietos.</p>
      </footer>
    </div>
  )
}