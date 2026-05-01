import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    // 1. Recibimos también el campo "template"
    const { title, description, stack, template } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }

    // 2. Verificación de Seguridad
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const githubToken = process.env.GITHUB_PAT
    if (!githubToken) return NextResponse.json({ error: 'Falta el Token de GitHub' }, { status: 500 })
    const repoName = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')

    // 3. Obtener usuario de GitHub (para la URL de la plantilla)
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${githubToken}` }
    })
    const githubUser = await userRes.json()

    // ------------------------------------------------------------------
    // 🧠 4. LA MAGIA DE LA IA (Gemini 2.0 Flash)
    // ------------------------------------------------------------------
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
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
      // OPCIÓN A: Generar desde plantilla de GitHub
      createRepoRes = await fetch(`https://api.github.com/repos/${githubUser.login}/${template}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github+json', // Cabecera especial para plantillas
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: description || 'Esqueleto generado por Sprout AI',
          private: true,
        }),
      })
    } else {
      // OPCIÓN B: Crear repositorio completamente vacío
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
       // Le damos 2 segundos a GitHub para que termine de copiar todos los archivos de tu plantilla
       await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const readmeBase64 = Buffer.from(readmeMarkdown).toString('base64')

    await fetch(`https://api.github.com/repos/${githubUser.login}/${repoName}/contents/README.md`, {
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

    return NextResponse.json({ success: true, repoUrl: repoData.html_url })

  } catch (error: any) {
    console.error('Error en API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}