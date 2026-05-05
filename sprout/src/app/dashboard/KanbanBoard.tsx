'use client'

import { useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Task = {
  id: string
  text: string
  completed: boolean
}

type Project = {
  id: string
  title: string
  description: string
  status: string
  stack: string[]
  template?: string
  tasks?: Task[]
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
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isCreatingRepo, setIsCreatingRepo] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const projectsByColumn = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      projects: projects.filter(p => p.status === col.id)
    }))
  }, [projects])

  const handleDragStart = useCallback((e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const projectId = e.dataTransfer.getData('projectId')

    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: newStatus } : p
    ))

    await supabase.from('projects').update({ status: newStatus }).eq('id', projectId)
  }, [])

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('¿Seguro que quieres borrar esta idea de Sprout?')) return
    setProjects(prev => prev.filter(p => p.id !== projectId))
    await supabase.from('projects').delete().eq('id', projectId)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    setProjects(prev => prev.map(p => p.id === editingProject.id ? editingProject : p))
    await supabase.from('projects').update({
      title: editingProject.title,
      description: editingProject.description,
      stack: editingProject.stack,
      tasks: editingProject.tasks
    }).eq('id', editingProject.id)
    
    setEditingProject(null)
  }

  const handleAddTask = () => {
    if (!editingProject || !newTaskText.trim()) return
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    }
    setEditingProject({
      ...editingProject,
      tasks: [...(editingProject.tasks || []), newTask]
    })
    setNewTaskText('')
  }

  const handleToggleTask = (taskId: string) => {
    if (!editingProject) return
    setEditingProject({
      ...editingProject,
      tasks: editingProject.tasks?.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    })
  }

  const handleDeleteTask = (taskId: string) => {
    if (!editingProject) return
    setEditingProject({
      ...editingProject,
      tasks: editingProject.tasks?.filter(t => t.id !== taskId)
    })
  }

  const handleCreateRepo = async (project: Project) => {
    try {
      setIsCreatingRepo(project.id)
      
      const response = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: project.title, 
          description: project.description,
          stack: project.stack,
          template: project.template || 'vacio'
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido al crear el repo')
      }

      window.open(data.repoUrl, '_blank')
      
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsCreatingRepo(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          {user.avatar && (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200" />
          )}
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold text-gray-900 leading-none">Sprout de {user.name} 🌱</h1>
            </Link>
            <p className="text-xs text-gray-500 mt-1">Sesión activa vía GitHub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleSignOut} className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors px-3 py-2">
            Cerrar sesión
          </button>
          <button onClick={() => router.push('/seed')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors text-center">
            + Nueva Idea
          </button>
        </div>
      </div>
      
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x px-4 md:px-8">
        {projectsByColumn.map((col) => (
          <div key={col.id} className="min-w-[260px] md:min-w-[280px] w-[260px] md:w-[280px] shrink-0 bg-gray-100/50 md:bg-gray-200/50 rounded-xl p-4 snap-center" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
            <h2 className="font-semibold text-gray-700 mb-4 flex justify-between items-center">
              <span className="truncate">{col.title}</span>
              <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ml-2">{col.projects.length}</span>
            </h2>
            
            <div className="space-y-3 md:space-y-4 min-h-[100px]">
              {col.projects.map((project: Project) => (
                  <div key={project.id} draggable onDragStart={(e) => handleDragStart(e, project.id)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 leading-tight">{project.title}</h3>
                      
                      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleCreateRepo(project)}
                          disabled={isCreatingRepo === project.id}
                          className="text-gray-400 hover:text-black p-1 disabled:opacity-50"
                          title="Crear Repositorio en GitHub"
                        >
                          {isCreatingRepo === project.id ? '⏳' : '🐙'}
                        </button>
                        <button onClick={() => setEditingProject(project)} className="text-gray-400 hover:text-blue-600 p-1" title="Editar">✏️</button>
                        <button onClick={() => handleDelete(project.id)} className="text-gray-400 hover:text-red-600 p-1" title="Borrar">🗑️</button>
                      </div>
                    </div>
                    
                    {project.description && <p className="text-sm text-gray-500 mt-1 line-clamp-3">{project.description}</p>}
                    
                    {project.stack && project.stack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.stack.map((tech, idx) => (
                          <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-medium">{tech}</span>
                        ))}
                      </div>
                    )}

                    {project.tasks && project.tasks.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {project.tasks.filter(t => t.completed).length}/{project.tasks.length} tareas
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* MODAL DE EDICIÓN TIPO JIRA */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  editingProject.status === 'idea' ? 'bg-yellow-100 text-yellow-800' :
                  editingProject.status === 'esqueleto_montado' ? 'bg-blue-100 text-blue-800' :
                  editingProject.status === 'en_desarrollo' ? 'bg-purple-100 text-purple-800' :
                  editingProject.status === 'en_pruebas' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {COLUMNS.find(c => c.id === editingProject.status)?.title}
                </div>
                <span className="text-gray-400 text-sm">编辑</span>
              </div>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none text-lg font-medium"
                  value={editingProject.title} 
                  onChange={(e) => setEditingProject({...editingProject, title: e.target.value})} 
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setEditingProject({...editingProject, status: col.id})}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        editingProject.status === col.id 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {col.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea 
                  rows={4}
                  className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="Describe tu proyecto, objetivos, funcionalidad..."
                  value={editingProject.description} 
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})} 
                />
              </div>

              {/* Stack */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stack Tecnológico</label>
                <input 
                  type="text" 
                  className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="React, TypeScript, Node.js, PostgreSQL..."
                  value={editingProject.stack.join(', ')} 
                  onChange={(e) => { 
                    const stackArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    setEditingProject({...editingProject, stack: stackArray})
                  }} 
                />
                {editingProject.stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingProject.stack.map((tech, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tareas/Requisitos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tareas / Requisitos
                  <span className="text-gray-400 font-normal ml-2">({editingProject.tasks?.length || 0})</span>
                </label>
                
                {/* Lista de tareas */}
                <div className="space-y-2 mb-3">
                  {editingProject.tasks?.map((task, idx) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {task.completed && '✓'}
                      </button>
                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-sm px-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                {/* Añadir tarea */}
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 bg-white text-gray-900 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Añadir tarea o requisito..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingProject(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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