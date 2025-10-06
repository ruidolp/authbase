import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario pertenezca a una familia y sea owner o admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.familyId || (user.role !== 'owner' && user.role !== 'admin')) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug son requeridos" }, { status: 400 })
    }

    // Validar formato del slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
      return NextResponse.json({ 
        error: "El slug debe tener entre 3-50 caracteres y solo contener letras, números y guiones" 
      }, { status: 400 })
    }

    // Palabras reservadas
    const reserved = ['admin', 'api', 'watch', 'invite', 'login', 'dashboard', 'editor', 'stats', 'family', 'signin', 'signout', 'auth']
    if (reserved.includes(slug)) {
      return NextResponse.json({ error: "Este slug está reservado" }, { status: 400 })
    }

    // Obtener familia actual
    const family = await prisma.family.findUnique({
      where: { id: user.familyId }
    })

    if (!family) {
      return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 })
    }

    // Verificar límite de cambios diarios (solo si el slug cambió)
    if (slug !== family.slug) {
      const today = new Date().toDateString()
      const lastChangeDate = family.lastSlugChangeDate?.toDateString()

      let changesCount = family.slugChangesToday

      // Si es un día diferente, resetear contador
      if (lastChangeDate !== today) {
        changesCount = 0
      }

      // Verificar límite
      if (changesCount >= 2) {
        return NextResponse.json({ 
          error: "Has excedido el límite de cambios (2/día). Podrás editarlo mañana" 
        }, { status: 429 })
      }

      // Verificar que el slug sea único
      const existing = await prisma.family.findUnique({
        where: { slug }
      })

      if (existing && existing.id !== family.id) {
        return NextResponse.json({ error: "Este slug ya está en uso" }, { status: 400 })
      }

      // Actualizar con incremento de contador
      const updated = await prisma.family.update({
        where: { id: family.id },
        data: {
          name,
          slug,
          lastSlugChangeDate: new Date(),
          slugChangesToday: changesCount + 1
        }
      })

      return NextResponse.json({ 
        success: true, 
        family: updated,
        changesRemaining: 1 - changesCount
      })
    } else {
      // Solo cambió el nombre, no incrementar contador
      const updated = await prisma.family.update({
        where: { id: family.id },
        data: { name }
      })

      return NextResponse.json({ success: true, family: updated })
    }
  } catch (error) {
    console.error("Error actualizando familia:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}