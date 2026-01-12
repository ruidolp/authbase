import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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
    const { nombre, url, videoType, videoId } = body

    if (!nombre || !url) {
      return NextResponse.json({ error: "Nombre y URL son requeridos" }, { status: 400 })
    }

    if (!videoType || !videoId) {
      return NextResponse.json({ error: "Tipo de video y ID son requeridos" }, { status: 400 })
    }

    if (videoType !== 'youtube' && videoType !== 'drive') {
      return NextResponse.json({ error: "Tipo de video inválido" }, { status: 400 })
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
        videoType,
        familyId: session.user.familyId
      }
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error("Error al agregar video:", error)
    return NextResponse.json({ error: "Error al guardar el video" }, { status: 500 })
  }
}
