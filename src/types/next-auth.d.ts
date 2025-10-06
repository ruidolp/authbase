import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      familyId?: string | null
      role?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    familyId?: string | null
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    familyId?: string | null
    role?: string | null
  }
}
