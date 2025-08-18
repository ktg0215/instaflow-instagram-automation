import type { DefaultSession, DefaultUser } from 'next-auth'
import type { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      email: string
      name: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    role: string
    email: string
    name: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string
    role: string
    email: string
    name: string
  }
}