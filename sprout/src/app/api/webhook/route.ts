import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Validar variables de entorno al inicio
  const requiredEnvVars = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missingVars = requiredEnvVars.filter(v => !process.env[v])
  
  if (missingVars.length > 0) {
    console.error('Webhook: Faltan variables de entorno:', missingVars)
    return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia' as any,
    })
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (userId) {
        console.log(`¡Pago confirmado! Activando Pro para el usuario: ${userId}`)
        
        const { error } = await supabaseAdmin
          .from('user_settings')
          .update({ is_pro: true })
          .eq('id', userId)

        if (error) {
          console.error('Error actualizando a Pro:', error)
          return NextResponse.json({ error: 'Error actualizando estado de usuario' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 400 })
  }
}