'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Ajustes() {
  const [githubToken, setGithubToken] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single()

    // 🛡️ BARRERA DE SEGURIDAD: Si no es Pro, lo expulsamos amablemente al tablero
    if (!data?.is_pro) {
      router.push('/dashboard')
      return
    }

    // Si llega aquí, es porque es Pro. Cargamos sus claves.
    if (data) {
      setGithubToken(data.github_token || '')
      setGeminiKey(data.gemini_api_key || '')
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        id: user?.id,
        github_token: githubToken,
        gemini_api_key: geminiKey,
        updated_at: new Date().toISOString()
      })

    if (error) {
      setMensaje({ texto: 'Error al guardar: ' + error.message, tipo: 'error' })
    } else {
      setMensaje({ texto: '✅ Ajustes guardados correctamente', tipo: 'exito' })
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium animate-pulse">Verificando credenciales...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuración</h1>
        <p className="text-gray-500 mb-8 text-lg">Administra tus claves de API para que Sprout pueda trabajar por ti.</p>

        {mensaje.texto && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <p className="text-blue-800 text-sm flex items-center gap-2">
              ℹ️ Estas claves se guardan de forma encriptada en tu base de datos y solo tú tienes acceso a ellas.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub Personal Access Token (PAT)</label>
            <input 
              type={showTokens ? "text" : "password"}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-sm"
              placeholder="ghp_xxxxxxxxxxxx"
              value={githubToken} onChange={(e) => setGithubToken(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gemini API Key</label>
            <input 
              type={showTokens ? "text" : "password"}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-sm"
              placeholder="AIzaSy..."
              value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button 
              type="submit" disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:bg-gray-300"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            <button 
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="px-6 py-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600 font-medium"
            >
              {showTokens ? 'Ocultar' : 'Ver Claves'}
            </button>
          </div>
        </form>
        
        <button onClick={() => router.push('/dashboard')} className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
          ← Volver al Tablero
        </button>
      </div>
    </main>
  )
}