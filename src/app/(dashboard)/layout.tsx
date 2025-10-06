import { auth } from "@/lib/auth"
import { Navigation } from "@/components/Navigation"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  console.log('🏠 Layout Dashboard:', {
    hasSession: !!session,
    userId: session?.user?.id,
    familyId: session?.user?.familyId
  })
  
  let userRole = null
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    userRole = user?.role
    console.log('👤 User role:', userRole)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation userRole={userRole} />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}