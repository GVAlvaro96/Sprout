import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const { title, description, stack, template } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }

    // 1. Identificar al usuario logueado
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // 2. EXTRAER LAS CLAVES DESDE LA BBDD (Modelo BYOK)
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('github_token, gemini_api_key')
      .single()

    if (settingsError || !settings?.github_token || !settings?.gemini_api_key) {
      return NextResponse.json({ 
        error: 'Faltan las API Keys. Por favor, ve a Configuración y guarda tus claves de GitHub y Gemini.' 
      }, { status: 400 })
    }

    const githubToken = settings.github_token
    const geminiApiKey = settings.gemini_api_key
    const repoName = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')

    // 3. Obtener usuario de GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${githubToken}` }
    })
    const githubUser = await userRes.json()

    // ------------------------------------------------------------------
    // 🧠 4. LA MAGIA DE LA IA (Con el prompt detallado)
    // ------------------------------------------------------------------
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
      Eres un desarrollador Senior. Escribe el contenido de un archivo README.md altamente profesional para un proyecto llamado "${title}".
      
      Contexto del proyecto:
      - Descripción: ${description || 'Un proyecto de software.'}
      - Tecnologías extra (Stack): ${stack && stack.length > 0 ? stack.join(', ') : 'No especificadas'}
      - Arquitectura base (Template): ${template !== 'vacio' ? template : 'Desde cero'}
      
      Estructura obligatoria:
      1. Título y badges (inventa un par de badges estéticos)
      2. Descripción clara
      3. Stack Tecnológico
      4. Instalación y Uso (Instrucciones de arranque. Si es FastAPI uvuicorn, indícalo)
      
      Devuelve ÚNICAMENTE el texto en Markdown, sin usar bloques de código (\`\`\`) que lo envuelvan.
    `
    const result = await model.generateContent(prompt)
    let readmeMarkdown = result.response.text()
    readmeMarkdown = readmeMarkdown.replace(/^```markdown\n/, '').replace(/\n```$/, '')

    // ------------------------------------------------------------------
    // 🐙 5. CREAR EL REPOSITORIO (Lógica Híbrida)
    // ------------------------------------------------------------------
    let createRepoRes;
    let repoData;

    if (template && template !== 'vacio') {
      createRepoRes = await fetch(`https://api.github.com/repos/${githubUser.login}/${template}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: description || 'Esqueleto generado por Sprout AI',
          private: true,
        }),
      })
    } else {
      createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: description || 'Creado con Sprout AI',
          private: true,
          auto_init: false, 
        }),
      })
    }

    if (!createRepoRes.ok) {
      const errorData = await createRepoRes.json()
      throw new Error(errorData.message || 'Error al crear o clonar el repositorio')
    }
    repoData = await createRepoRes.json()

    // ------------------------------------------------------------------
    // ⏳ 6. PAUSA E INYECCIÓN DEL README
    // ------------------------------------------------------------------
    if (template && template !== 'vacio') {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const readmeBase64 = Buffer.from(readmeMarkdown).toString('base64')

    const readmeRes = await fetch(`https://api.github.com/repos/${githubUser.login}/${repoName}/contents/README.md`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '🌱 Initial commit: Add AI generated README via Sprout',
        content: readmeBase64,
      }),
    })

    if (!readmeRes.ok) {
      const readmeError = await readmeRes.json();
      console.error('⚠️ El repositorio se creó, pero GitHub rechazó el README:', readmeError);
    }

    return NextResponse.json({ success: true, repoUrl: repoData.html_url })
    
  } catch (error: any) {
    console.error('Error en API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}