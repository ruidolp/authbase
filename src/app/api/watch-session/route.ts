import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Verificar que el body no esté vacío
    const text = await request.text()
    
    if (!text || text.trim() === '') {
      console.log('Request sin body recibido')
      return NextResponse.json({ error: "Body vacío" }, { status: 400 })
    }

    const body = JSON.parse(text)
    const { action, videoId, videoName, familyId, sessionId, seconds, completed } = body

    if (!action) {
      return NextResponse.json({ error: "Acción requerida" }, { status: 400 })
    }

    if (action === 'start') {
      // Iniciar sesión
      const session = await prisma.watchSession.create({
        data: {
          videoId: parseInt(videoId),
          videoNombre: videoName,
          familyId: familyId,
        }
      })

      return NextResponse.json({ success: true, sessionId: session.id })
    }

    if (action === 'end') {
      // Finalizar sesión
      if (!sessionId) {
        return NextResponse.json({ error: "sessionId requerido" }, { status: 400 })
      }

      await prisma.watchSession.update({
        where: { id: parseInt(sessionId) },
        data: {
          endedAt: new Date(),
          secondsWatched: seconds || 0,
          completed: completed || false
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    console.error("Error en watch session:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
