import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ hasAccess: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { videoId, familyId } = body

    if (!videoId || !familyId) {
      return NextResponse.json({ hasAccess: false, error: "Missing parameters" }, { status: 400 })
    }

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ hasAccess: false, error: "User not found" }, { status: 404 })
    }

    // Verificar que el usuario pertenezca a la familia
    if (user.familyId !== familyId) {
      return NextResponse.json({ hasAccess: false, error: "Not a member of this family" }, { status: 403 })
    }

    // Verificar que el video pertenezca a la familia
    const video = await prisma.video.findFirst({
      where: {
        video_id: videoId,
        familyId: familyId,
      },
    })

    if (!video) {
      return NextResponse.json({ hasAccess: false, error: "Video not found in this family" }, { status: 404 })
    }

    // Todo OK - el usuario tiene acceso al video
    return NextResponse.json({
      hasAccess: true,
      videoId: video.video_id,
      videoName: video.nombre
    })
  } catch (error) {
    console.error("[validate-video-access] Error:", error)
    return NextResponse.json(
      { hasAccess: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
