import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InviteClient } from "@/components/InviteClient"
import Link from "next/link"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  
  // Buscar invitación
  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
    include: { 
      family: true,
      inviter: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Invitación no encontrada</h1>
          <p className="text-gray-600 mb-4">
            Este link de invitación no existe o ya expiró.
          </p>
          <Link 
            href="/login"
            className="block w-full text-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Ir a inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  if (invitation.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Invitación ya aceptada</h1>
          <p className="text-gray-600 mb-4">
            Esta invitación ya fue aceptada previamente.
          </p>
          <a 
            href="/dashboard"
            className="block w-full text-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    )
  }

  const session = await auth()

  return (
    <InviteClient 
      invitation={{
        id: invitation.id,
        familyName: invitation.family.name,
        inviterName: invitation.inviter.name || invitation.inviter.email || 'Alguien',
        invitedEmail: invitation.invitedEmail,
        token: invitation.token
      }}
      session={session}
    />
  )
}
