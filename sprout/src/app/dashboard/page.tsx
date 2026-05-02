import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import KanbanBoard from './KanbanBoard'

export const revalidate = 0

export default async function Dashboard() {
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

  // 1. Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Extraemos el nickname y el avatar de los metadatos de GitHub
  const userName = user?.user_metadata?.user_name || user?.user_metadata?.full_name || 'Developer'
  const avatarUrl = user?.user_metadata?.avatar_url

  // ------------------------------------------------------------------
  // 🌟 NUEVO: Comprobamos si el usuario ha pagado (Es Pro)
  // ------------------------------------------------------------------
  let isPro = false
  if (user) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('is_pro')
      .eq('id', user.id)
      .single()
    
    isPro = !!settings?.is_pro
  }

  // 3. Cargamos los proyectos
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error cargando proyectos: {error.message}</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      {/* 🚀 NUEVA CABECERA (NavBar) */}
      <nav className="flex justify-between items-center p-4 md:px-8 md:py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <h1 className="text-xl font-bold text-gray-800">Sprout</h1>
        </div>

        <div className="flex items-center gap-4">
          {isPro ? (
            // BOTÓN DE AJUSTES (Solo para usuarios Pro)
            <Link 
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
            >
              ⚙️ Ajustes
            </Link>
          ) : (
            // BOTÓN DE COMPRA (Para usuarios gratuitos)
            <Link 
              href="/pricing" /* Cambia esto por tu enlace de Stripe Checkout en el futuro */
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-sm hover:shadow transition-all"
            >
              ⭐ Subir a Pro
            </Link>
          )}

          {/* Mini Avatar del usuario */}
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-100 hidden md:block">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 4. Pasamos los datos del usuario al Kanban */}
      <main className="flex-1 relative">
        <KanbanBoard 
          initialProjects={projects || []} 
          user={{ name: userName, avatar: avatarUrl }} 
        />
      </main>
    </div>
  )
}