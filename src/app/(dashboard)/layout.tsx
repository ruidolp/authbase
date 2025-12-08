import { auth } from "@/lib/auth"
import { Navigation } from "@/components/Navigation"
import { prisma } from "@/lib/prisma"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

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
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            Hola {session?.user?.name || 'amigo'} <span aria-hidden="true">👋</span>
          </span>
          <Separator orientation="vertical" className="h-6" />
          <div id="page-header" className="flex-1">
            {/* Los títulos de página se inyectarán aquí */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
