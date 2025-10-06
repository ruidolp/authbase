/*import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const family = await prisma.family.findUnique({
      where: { slug: params.slug }
    })

    if (!family) {
      return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 })
    }

    const videos = await prisma.video.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      familyId: family.id,
      familyName: family.name,
      videos
    })
  } catch (error) {
    console.error("Error cargando videos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

*/
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // 👈 Promise en Next 15
) {
  try {
    const { slug } = await params

    const family = await prisma.family.findUnique({
      where: { slug }
    })

    if (!family) {
      return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 })
    }

    const videos = await prisma.video.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      familyId: family.id,
      familyName: family.name,
      videos
    })
  } catch (error) {
    console.error("Error cargando videos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
