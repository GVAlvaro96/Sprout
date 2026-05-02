'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PricingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
      })
      const data = await res.json()

      if (data.url) {
        // Redirigimos al usuario a la página segura de Stripe
        window.location.href = data.url
      } else {
        alert("Error al iniciar el pago: " + (data.error || "Desconocido"))
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Hubo un problema al conectar con el servidor.")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navegación simple */}
      <nav className="p-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2 transition-colors"
        >
          ← Volver al Tablero
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Desbloquea el poder del <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Pulpo 🐙</span>
          </h1>
          <p className="text-xl text-gray-600">
            Deja de perder tiempo configurando repositorios en blanco. Automatiza tu flujo de trabajo con IA por un pago único. Sin suscripciones.
          </p>
        </div>

        {/* Tarjeta de Precio */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 max-w-md w-full relative overflow-hidden">
          {/* Badge superior */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
            LIFETIME DEAL
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sprout Pro</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-gray-900">9,99€</span>
              <span className="text-gray-500 font-medium">/ pago único</span>
            </div>
            <p className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              💡 <strong className="text-gray-700">Modelo BYOK:</strong> Usa tus propias API Keys de GitHub y Gemini. Tus costes de IA dependen solo de tu uso, sin intermediarios.
            </p>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Automatización de repositorios en 1 clic',
              'Clonado inteligente de plantillas base',
              'Generación de README.md con IA',
              'Guarda tus propias API Keys (BYOK)',
              'Acceso de por vida a futuras actualizaciones',
              'Soporte directo del creador'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <span className="text-green-500 text-xl leading-none">✓</span>
                <span className="leading-tight">{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
          >
            {isLoading ? 'Cargando seguro...' : 'Conseguir Sprout Pro'}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Pago seguro procesado por Stripe.
          </p>
        </div>
      </div>
    </main>
  )
}