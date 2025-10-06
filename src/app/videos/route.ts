import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.familyId) {
      return NextResponse.json({ videos: [] })
    }

    const videos = await prisma.video.findMany({
      where: { familyId: user.familyId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Error obteniendo videos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // Permitir tanto owner como admin
    if (!user?.familyId || (user.role !== 'owner' && user.role !== 'admin')) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 })
    }

    let videoId = ""
    
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0] || ""
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || ""
    }

    if (!videoId) {
      return NextResponse.json({ error: "URL de YouTube inválida" }, { status: 400 })
    }

    const existingVideo = await prisma.video.findUnique({
      where: { video_id: videoId }
    })

    if (existingVideo) {
      return NextResponse.json({ error: "Este video ya existe" }, { status: 400 })
    }

    const video = await prisma.video.create({
      data: {
        video_id: videoId,
        nombre: `Video ${videoId}`,
        url: url,
        familyId: user.familyId
      }
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Error agregando video:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}