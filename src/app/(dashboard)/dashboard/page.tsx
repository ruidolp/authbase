import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ShareLinkCard } from "@/components/ShareLinkCard"
import { FamilyInfo } from "@/components/FamilyInfo"


export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Obtener usuario completo con familia
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { family: true }
  })

  if (!user?.familyId || !user.family) {
    redirect('/login')
  }

  const family = user.family

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          {/* Familia con edición */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Información</h2>
            <FamilyInfo 
              familyName={family.name}
              familySlug={family.slug}
            />
          </div>
        </div>

        {/* Link compartible */}
        <ShareLinkCard slug={family.slug} />

        {/* Gestión de miembros (solo para owner) */}
        {user.role === 'owner' && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mt-6">
            <h2 className="text-lg font-semibold mb-2">Miembros de la Familia</h2>
            <p className="text-gray-600 mb-4">
              Invita a otros miembros para que puedan gestionar los videos de tu familia
            </p>
            <Link 
              href="/family"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Gestionar Miembros
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
