import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize() {
        // TODO: Implementar login con email/password
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  callbacks: {
async jwt({ token, user }) {
  // Si es un nuevo login y tenemos el user
  if (user?.id) {
    // Buscar el usuario en la DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { family: true }
    })

    // Si el usuario existe pero NO tiene familia
    if (dbUser && !dbUser.familyId) {
      console.log(`👤 Usuario sin familia: ${dbUser.email}`)
      
      // Verificar si hay una invitación pendiente para este email
      const pendingInvitation = await prisma.familyInvitation.findFirst({
        where: {
          invitedEmail: dbUser.email,
          status: 'pending'
        }
      })

      if (pendingInvitation) {
        console.log(`📧 Invitación pendiente encontrada, NO crear familia automática`)
        // NO crear familia, dejar que la página de invitación lo maneje
        token.familyId = null
        token.role = null
      } else {
        // No hay invitación pendiente, crear familia automáticamente
        console.log(`🏠 Creando familia para: ${dbUser.email}`)
        
        try {
          // Generar slug base
          const baseSlug = (dbUser.name || 'familia')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          // Verificar unicidad del slug
          let slug = baseSlug
          let counter = 1
          while (true) {
            const existing = await prisma.family.findUnique({
              where: { slug }
            })
            if (!existing) break
            slug = `${baseSlug}-${counter}`
            counter++
          }

          // Crear familia
          const family = await prisma.family.create({
            data: {
              name: `Familia de ${dbUser.name || 'Usuario'}`,
              slug: slug,
              createdBy: dbUser.id,
            },
          })

          // Asignar usuario a la familia como owner
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              familyId: family.id,
              role: 'owner',
            },
          })

          console.log(`✅ Familia creada: ${family.name} (slug: ${slug})`)
          
          token.familyId = family.id
          token.role = 'owner'
        } catch (error) {
          console.error('❌ Error creando familia:', error)
        }
      }
    } else if (dbUser) {
      // Si ya tiene familia, agregar al token
      token.familyId = dbUser.familyId
      token.role = dbUser.role
    }
  }
  
  return token
},
    
    async session({ session, token }) {
      // Agregar familyId y role a la sesión
      if (session.user) {
        session.user.id = token.sub as string 
        session.user.familyId = token.familyId as string | null
        session.user.role = token.role as string | null
      }
      return session
    }
  }
})