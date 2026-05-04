import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-bold tracking-tight text-green-700">Sprout</span>
        </Link>
        
        <div>
          {user ? (
            <Link href="/dashboard" className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all">
              Ir al Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-semibold flex items-center gap-2 border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition-all">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span>🚀</span>
          <span>De idea a repo en 30 segundos</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
          No dejes que tus ideas <br /> se marchiten.
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Sprout es la incubadora minimalista para desarrolladores. Captura ideas de proyectos, gestiónalas en un tablero Kanban y conviértelas en repositorios reales con un clic.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={user ? "/seed" : "/login"} className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-1">
            Plantar una idea 🌱
          </Link>
          <Link href="#como-funciona" className="w-full sm:w-auto bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all">
            Saber más
          </Link>
        </div>
      </main>

      {/* CÓMO FUNCIONA - FLUJO VISUAL */}
      <section id="como-funciona" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">🌱 De la semilla al código</h2>
            <p className="text-gray-600 text-lg">En solo 3 pasos tienes tu repositorio listo</p>
          </div>

          {/* Paso 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">💡</div>
                  <div className="text-xs font-bold text-gray-600">1. Captura</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Planta tu idea</h3>
              <p className="text-gray-600 leading-relaxed">
                Escribe el título, descripción y stack tecnológico de tu proyecto. En el metro, en el café, donde quieras. 
                Tus ideas se guardan en un tablero Kanban visual donde puedes moverlas según su estado.
              </p>
            </div>
          </div>

          {/* Flecha decorativa */}
          <div className="flex justify-center mb-12">
            <div className="text-2xl text-green-500 animate-bounce">↓</div>
          </div>

          {/* Paso 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-12">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚙️</div>
                  <div className="text-xs font-bold text-gray-600">2. IA Genera</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">La IA escribe el README</h3>
              <p className="text-gray-600 leading-relaxed">
                Cuando mueves una idea a "Esqueleto", Sprout usa Gemini AI para generar un README.md 
                profesional y personalizado según tu descripción y stack. No más README vacíos.
              </p>
            </div>
          </div>

          {/* Flecha decorativa */}
          <div className="flex justify-center mb-12">
            <div className="text-2xl text-green-500 animate-bounce">↓</div>
          </div>

          {/* Paso 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🐙</div>
                  <div className="text-xs font-bold text-gray-600">3. Repo GitHub</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Un clic → Repositorio creado</h3>
              <p className="text-gray-600 leading-relaxed">
                Haz clic en el botón 🐙 de cualquier tarjeta y Sprout crea el repositorio en tu GitHub 
                con el README generado. Privado, listo para empezar a programar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MODELO BYOK - EXPLICACIÓN VISUAL */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold">
              💰 Modelo BYOK (Bring Your Own Keys)
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">¿Qué es Sprout Pro?</h2>
          </div>

          {/* Diagrama visual del modelo */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              
              {/* Tu parte */}
              <div className="bg-white/10 rounded-2xl p-6">
                <div className="text-4xl mb-3">🔑</div>
                <h4 className="font-bold text-lg mb-2">Tú aportas</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Tu GitHub PAT</li>
                  <li>• Tu Gemini API Key</li>
                  <li>• 9,99€ una vez</li>
                </ul>
              </div>

              {/* Flecha */}
              <div className="flex items-center justify-center">
                <div className="text-4xl text-green-400">→</div>
              </div>

              {/* Sprout parte */}
              <div className="bg-green-600/20 rounded-2xl p-6 border border-green-500/30">
                <div className="text-4xl mb-3">✨</div>
                <h4 className="font-bold text-lg mb-2">Sprout hace</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Crea repositorios</li>
                  <li>• Genera README con IA</li>
                  <li>• Guarda tus claves</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-400">
              Sin mensualidades. Tus claves, tu control.
            </div>
          </div>

          {/* Comparativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <span>❌</span> Otras herramientas
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Cobran mensualidad ($9-29/mes)</li>
                <li>• Usan sus propias API keys (margen)</li>
                <li>• Limitan uso de IA</li>
                <li>• Tus datos en sus servidores</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <span>✅</span> Sprout Pro
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Pago único: 9,99€ para siempre</li>
                <li>• Tú traes tus propias claves</li>
                <li>• IA ilimitada (según tu plan)</li>
                <li>• Tus claves solo en tu BBDD</li>
              </ul>
            </div>
          </div>

          {/* CTA Pricing */}
          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all hover:-translate-y-1 shadow-xl">
              <span>Desbloquea Sprout Pro</span>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-lg">9,99€</span>
            </Link>
            <p className="text-gray-500 text-sm mt-4">Pago único. Sin suscripción. Sinsorero.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
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
              Crea el repositorio y el esqueleto del código automáticamente desde el tablero. 
              <span className="text-green-600 font-bold"> (Solo Pro)</span>
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