import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Función helper para extraer videoId de YouTube
function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

// GET - Listar videos de la familia
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.familyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const videos = await prisma.video.findMany({
      where: {
        familyId: session.user.familyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error("Error al obtener videos:", error)
    return NextResponse.json({ error: "Error al cargar videos" }, { status: 500 })
  }
}

// POST - Agregar nuevo video
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.familyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, url } = body

    if (!nombre || !url) {
      return NextResponse.json({ error: "Nombre y URL son requeridos" }, { status: 400 })
    }

    // Extraer y validar videoId de YouTube
    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: "URL de YouTube inválida" }, { status: 400 })
    }

    // Verificar si el video ya existe en esta familia
    const existingVideo = await prisma.video.findFirst({
      where: {
        video_id: videoId,
        familyId: session.user.familyId
      }
    })

    if (existingVideo) {
      return NextResponse.json({ error: "Este video ya existe en tu colección" }, { status: 400 })
    }

    // Crear el video
    const video = await prisma.video.create({
      data: {
        video_id: videoId,
        nombre,
        url,
        familyId: session.user.familyId
      }
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error("Error al agregar video:", error)
    return NextResponse.json({ error: "Error al guardar el video" }, { status: 500 })
  }
}
