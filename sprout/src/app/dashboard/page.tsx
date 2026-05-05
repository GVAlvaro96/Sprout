import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import KanbanBoard from './KanbanBoard'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | Sprout',
  description: 'Gestiona tus ideas de proyectos',
}

async function getUserData() {
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

  const [authData, projectsData] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('projects').select('*').order('created_at', { ascending: false })
  ])

  const user = authData.data?.user
  const settingsData = user 
    ? await supabase.from('user_settings').select('is_pro').eq('id', user.id).single()
    : { data: null }

  const userName = user?.user_metadata?.user_name || user?.user_metadata?.full_name || 'Developer'
  const avatarUrl = user?.user_metadata?.avatar_url
  const isPro = !!settingsData.data?.is_pro

  return { 
    user: user ? { name: userName, avatar: avatarUrl } : null, 
    isPro, 
    projects: projectsData.data || [],
    error: projectsData.error
  }
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Cargando proyectos...</p>
      </div>
    </div>
  )
}

export default async function Dashboard() {
  const { user, isPro, projects, error } = await getUserData()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <p className="font-medium">Error cargando proyectos: {error.message}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* NavBar mejorado */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🌱</span>
              <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Sprout</h1>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isPro ? (
                <Link 
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline">Ajustes</span>
                </Link>
              ) : (
                <Link 
                  href="/pricing"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-sm transition-all hover:shadow"
                >
                  <span className="text-yellow-300">★</span>
                  <span className="hidden sm:inline">Subir a Pro</span>
                </Link>
              )}

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-100">
                {user.avatar ? (
                  <Image 
                    src={user.avatar} 
                    alt={user.name} 
                    width={32} 
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <Suspense fallback={<DashboardSkeleton />}>
        <main className="flex-1">
          <KanbanBoard 
            initialProjects={projects} 
            user={user}
          />
        </main>
      </Suspense>
    </div>
  )
}