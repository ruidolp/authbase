import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
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

    const { id } = await context.params
    const { nombre } = await request.json()

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    }

    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) }
    })

    if (!video || video.familyId !== user.familyId) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 })
    }

    const updatedVideo = await prisma.video.update({
      where: { id: parseInt(id) },
      data: { nombre }
    })

    return NextResponse.json({ video: updatedVideo })
  } catch (error) {
    console.error("Error actualizando video:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

    const { id } = await context.params

    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) }
    })

    if (!video || video.familyId !== user.familyId) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 })
    }

    await prisma.video.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando video:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}