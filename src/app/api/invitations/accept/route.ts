import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión primero" }, { status: 401 })
    }

    const { token } = await request.json()

    // Buscar invitación
    const invitation = await prisma.familyInvitation.findUnique({
      where: { token },
      include: { family: true }
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: "Esta invitación ya fue aceptada" }, { status: 400 })
    }

    // Verificar que el email coincida
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.email !== invitation.invitedEmail) {
      return NextResponse.json({ error: "Esta invitación no es para tu cuenta" }, { status: 403 })
    }

    // Verificar que el usuario no tenga familia
    if (user.familyId) {
      return NextResponse.json({ error: "Ya perteneces a una familia" }, { status: 400 })
    }

    // Actualizar usuario y invitación
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          familyId: invitation.familyId,
          role: 'admin'
        }
      }),
      prisma.familyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      })
    ])

    return NextResponse.json({ success: true, familySlug: invitation.family.slug })

  } catch (error) {
    console.error("Error aceptando invitación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
