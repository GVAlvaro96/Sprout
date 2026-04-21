'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  title: string
  description: string
  status: string
  stack: string[]
}

type UserProps = {
  name: string
  avatar: string
}

const COLUMNS = [
  { id: 'idea', title: '💡 Ideas' },
  { id: 'esqueleto_montado', title: '🏗️ Esqueleto' },
  { id: 'en_desarrollo', title: '⚙️ Desarrollo' },
  { id: 'en_pruebas', title: '🧪 Pruebas' },
  { id: 'en_produccion', title: '🚀 Producción' },
]

export default function KanbanBoard({ 
  initialProjects, 
  user 
}: { 
  initialProjects: Project[], 
  user: UserProps 
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  
  // Estado para controlar si estamos editando un proyecto (abre el Modal)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  
  const router = useRouter()

  // --- LÓGICA DE SESIÓN ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const projectId = e.dataTransfer.getData('projectId')

    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: newStatus } : p
    ))

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId)

    if (error) console.error("Error actualizando estado:", error)
  }

  // --- LÓGICA DE BORRADO (DELETE) ---
  const handleDelete = async (projectId: string) => {
    // Pedimos confirmación nativa para evitar borrados por accidente
    if (!window.confirm('¿Seguro que quieres borrar esta idea de Sprout?')) return

    // 1. Borrado optimista en la UI
    setProjects(prev => prev.filter(p => p.id !== projectId))

    // 2. Borrado real en base de datos
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) console.error("Error al borrar:", error)
  }

  // --- LÓGICA DE EDICIÓN (UPDATE) ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    // 1. Actualización optimista en la UI
    setProjects(prev => prev.map(p => p.id === editingProject.id ? editingProject : p))

    // 2. Actualización real en base de datos
    const { error } = await supabase
      .from('projects')
      .update({
        title: editingProject.title,
        description: editingProject.description,
        stack: editingProject.stack
      })
      .eq('id', editingProject.id)

    if (error) console.error("Error al actualizar:", error)
    
    // 3. Cerramos el modal
    setEditingProject(null)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          {user.avatar && (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200" />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Sprout de {user.name} 🌱</h1>
            <p className="text-xs text-gray-500 mt-1">Sesión activa vía GitHub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSignOut}
            className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors px-3 py-2"
          >
            Cerrar sesión
          </button>
          <button 
            onClick={() => router.push('/seed')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors text-center"
          >
            + Nueva Idea
          </button>
        </div>
      </div>
      
      {/* Tablero Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map((col) => {
          const columnProjects = projects.filter((p) => p.status === col.id)

          return (
            <div 
              key={col.id} 
              className="min-w-[280px] w-[280px] shrink-0 bg-gray-200/50 rounded-xl p-4 snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <h2 className="font-semibold text-gray-700 mb-4 flex justify-between items-center">
                {col.title}
                <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {columnProjects.length}
                </span>
              </h2>
              
              <div className="space-y-4 min-h-[100px]">
                {columnProjects.map((project: Project) => (
                  <div 
                    key={project.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 leading-tight">{project.title}</h3>
                      
                      {/* Botones de acción (visibles al pasar el ratón o en móvil siempre) */}
                      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingProject(project)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(project.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Borrar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    
                    {project.stack && project.stack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.stack.map((tech, idx) => (
                          <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL DE EDICIÓN (Ventana flotante) */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Editar Idea</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input 
                  type="text" required
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea 
                  rows={3}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stack (comas)</label>
                <input 
                  type="text" 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={editingProject.stack.join(', ')}
                  onChange={(e) => {
                    const stackArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    setEditingProject({...editingProject, stack: stackArray})
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}