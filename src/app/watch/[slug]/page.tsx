import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { WatchClient } from "@/components/WatchClient"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params
  
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

  return (
    <WatchClient 
      familyId={family.id}
      familyName={family.name}
      initialVideos={videos}
    />
  )
}
