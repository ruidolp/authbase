import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FamilyClient } from "@/components/FamilyClient"

export default async function FamilyPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      family: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              createdAt: true
            },
            orderBy: { role: 'asc' }
          }
        }
      }
    }
  })

  if (!user?.familyId) {
    redirect("/dashboard")
  }

  const invitations = await prisma.familyInvitation.findMany({
    where: { familyId: user.familyId },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6">
      <FamilyClient 
        currentUser={{
          id: user.id,
          role: user.role || 'admin'
        }}
        family={user.family!}
        members={user.family!.users}
        invitations={invitations}
      />
    </div>
  )
}