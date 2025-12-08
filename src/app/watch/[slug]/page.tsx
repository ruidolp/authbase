import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { WatchClient } from "@/components/WatchClient"
import { auth } from "@/lib/auth"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params
  const session = await auth()

  const family = await prisma.family.findUnique({
    where: { slug }
  })

  if (!family) {
    notFound()
  }

  const videos = await prisma.video.findMany({
    where: { familyId: family.id },
    orderBy: { createdAt: 'desc' }
  })

  let userRole = null
  let userFamilySlug = null

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
    userFamilySlug = user?.family?.slug
  }

  return (
    <WatchClient
      familyId={family.id}
      familyName={family.name}
      initialVideos={videos}
      userRole={userRole}
      familySlug={userFamilySlug}
    />
  )
}
