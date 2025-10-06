import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { userId } = await request.json()

    // Verificar que el usuario sea owner
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (currentUser?.role !== 'owner') {
      return NextResponse.json({ error: "Solo el owner puede remover miembros" }, { status: 403 })
    }

    // Verificar que el usuario a remover sea admin de la misma familia
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userToRemove || userToRemove.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (userToRemove.role === 'owner') {
      return NextResponse.json({ error: "No puedes remover al owner" }, { status: 403 })
    }

    // Desvincular usuario de la familia
    await prisma.user.update({
      where: { id: userId },
      data: {
        familyId: null,
        role: null
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error removiendo miembro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

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
      return NextResponse.json({ members: [] })
    }

    const members = await prisma.user.findMany({
      where: { familyId: user.familyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true
      },
      orderBy: { role: 'asc' } // owner primero
    })

    return NextResponse.json({ members })

  } catch (error) {
    console.error("Error obteniendo miembros:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
