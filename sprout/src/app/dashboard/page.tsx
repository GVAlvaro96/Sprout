import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error cargando proyectos: {error.message}</div>
  }

  // 3. Pasamos los datos del usuario al Kanban
  return (
    <KanbanBoard 
      initialProjects={projects || []} 
      user={{ name: userName, avatar: avatarUrl }} 
    />
  )
}