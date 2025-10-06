import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { family: { include: { users: true } } }
    })

    if (!user?.familyId || user.role !== 'owner') {
      return NextResponse.json({ error: "Solo el owner puede invitar" }, { status: 403 })
    }

    if (user.family!.users.length >= 2) {
      return NextResponse.json({ error: "Límite de miembros alcanzado (máximo 2)" }, { status: 400 })
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email }
    })

    if (invitedUser?.familyId) {
      return NextResponse.json({ error: "Este usuario ya pertenece a una familia" }, { status: 400 })
    }

    const existingInvitation = await prisma.familyInvitation.findFirst({
      where: {
        familyId: user.familyId,
        invitedEmail: email,
        status: 'pending'
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "Ya existe una invitación pendiente para este email" }, { status: 400 })
    }

    const invitation = await prisma.familyInvitation.create({
      data: {
        familyId: user.familyId,
        invitedEmail: email,
        invitedBy: session.user.id,
        token: generateToken(),
        status: 'pending'
      }
    })

    return NextResponse.json({ 
      success: true, 
      token: invitation.token,
      invitationId: invitation.id
    })

  } catch (error) {
    console.error("Error creando invitación:", error)
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
      return NextResponse.json({ invitations: [] })
    }

    const invitations = await prisma.familyInvitation.findMany({
      where: { familyId: user.familyId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ invitations })

  } catch (error) {
    console.error("Error obteniendo invitaciones:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}