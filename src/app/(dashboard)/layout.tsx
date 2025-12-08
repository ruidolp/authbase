import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navigation } from "@/components/Navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/DashboardHeader"

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
  let familySlug = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        family: {
          select: { slug: true }
        }
      }
    })
    userRole = user?.role
    familySlug = user?.family?.slug
    console.log('👤 User role:', userRole, 'Family slug:', familySlug)
  }

  return (
    <SidebarProvider>
      <Navigation userRole={userRole} familySlug={familySlug} />
      <SidebarInset>
        <DashboardHeader
          userName={session?.user?.name}
          familySlug={familySlug}
        />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
