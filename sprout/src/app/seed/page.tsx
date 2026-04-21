'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NuevaIdea() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stackInput, setStackInput] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  
  const router = useRouter()

  // Verificación de seguridad proactiva
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMensaje({ texto: '', tipo: '' })
    
    // Obtenemos el usuario de la sesión actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      setMensaje({ texto: 'Sesión expirada. Por favor, vuelve a loguearte.', tipo: 'error' })
      setIsSubmitting(false)
      return
    }

    const stackArray = stackInput.split(',').map(tech => tech.trim()).filter(Boolean)

    // INSERT en Supabase
    const { error: insertError } = await supabase
      .from('projects')
      .insert([
        {
          title,
          description,
          stack: stackArray,
          status: 'idea',
          user_id: user.id 
        }
      ])

    if (insertError) {
      console.error("Error de Supabase:", insertError)
      setMensaje({ texto: `Error: ${insertError.message}`, tipo: 'error' })
      setIsSubmitting(false)
    } else {
      setMensaje({ texto: '✅ ¡Idea plantada! Redirigiendo...', tipo: 'exito' })
      
      // Limpiamos caché y redirigimos
      // Usamos un pequeño timeout para asegurar que el estado se procesa
      setTimeout(() => {
        router.refresh()
        router.push('/dashboard')
      }, 800)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 mt-10 border border-gray-100">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🌱 Nueva Idea
          </h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Cancelar
          </button>
        </div>

        {mensaje.texto && (
          <div className={`p-3 mb-4 rounded-md text-sm font-medium animate-pulse ${
            mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del Proyecto</label>
            <input 
              type="text" 
              required
              placeholder="Ej: Mi próximo SaaS"
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              rows={4}
              placeholder="¿Qué vas a construir?"
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stack (comas)</label>
            <input 
              type="text" 
              placeholder="React, Tailwind, Go..."
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all ${
              isSubmitting 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5'
            }`}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Idea en Sprout'}
          </button>
        </form>
      </div>
    </main>
  )
}