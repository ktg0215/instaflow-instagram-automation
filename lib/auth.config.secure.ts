import { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { User } from '@/types/auth'

// SECURITY FIX: Remove hardcoded credentials - use database queries instead
async function getUserFromDatabase(email: string): Promise<User | null> {
  try {
    // Import database dynamically to prevent client-side bundling
    const database = await import('@/lib/database')
    const db = database.default
    
    console.log('🔍 [AUTH] Querying database for user:', email)
    
    const result = await db.query(
      'SELECT id, email, password, name, role, created_at FROM users WHERE email = $1',
      [email]
    )
    
    if (result.rows.length === 0) {
      console.log('❌ [AUTH] User not found:', email)
      return null
    }
    
    const user = result.rows[0]
    console.log('✅ [AUTH] User found:', { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    })
    
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      created_at: new Date(user.created_at)
    }
  } catch (error) {
    console.error('❌ [AUTH] Database query error:', error)
    return null
  }
}

// SECURITY: Validate JWT secret strength
function validateJWTSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET or JWT_SECRET must be configured')
  }
  
  if (secret.includes('development') || secret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters and not contain "development"')
  }
  
  return secret
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: false, // SECURITY: Disable debug in production
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email && user.name) {
        try {
          // SECURITY: Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(user.email)) {
            console.error('❌ [AUTH] Invalid email format:', user.email)
            return false
          }
          
          const dbUser = await createOrUpdateGoogleUser(user.email, user.name)
          if (dbUser) {
            user.id = dbUser.id.toString()
            ;(user as any).role = dbUser.role
            return true
          }
          return false
        } catch (error) {
          console.error('❌ [AUTH] Google user creation error:', error)
          return false
        }
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || 'user'
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // SECURITY: Input validation
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        // SECURITY: Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(credentials.email)) {
          return null
        }
        
        // SECURITY: Password length validation
        if (credentials.password.length < 6) {
          return null
        }
        
        try {
          const user = await getUserFromDatabase(credentials.email as string)
          
          if (!user || !user.password) {
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          
          if (!isPasswordValid) {
            return null
          }
          
          // Return user object without password
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ [AUTH] Authentication error:', error)
          return null
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: validateJWTSecret(),
}

// SECURITY: Create or update Google user with validation
async function createOrUpdateGoogleUser(email: string, name: string): Promise<User | null> {
  try {
    // SECURITY: Input sanitization
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedName = name.trim().substring(0, 100) // Limit name length
    
    const existingUser = await getUserFromDatabase(sanitizedEmail)
    
    if (existingUser) {
      try {
        const database = await import('@/lib/database')
        const db = database.default
        
        await db.query(
          'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
          [sanitizedName, sanitizedEmail]
        )
        
        return {
          ...existingUser,
          name: sanitizedName
        }
      } catch (updateError) {
        console.error('❌ [AUTH] Error updating Google user:', updateError)
        return existingUser
      }
    } else {
      try {
        const database = await import('@/lib/database')
        const db = database.default
        
        const result = await db.query(
          'INSERT INTO users (email, name, role, password, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id, email, name, role, created_at',
          [sanitizedEmail, sanitizedName, 'user', '']
        )
        
        const newDbUser = result.rows[0]
        return {
          id: newDbUser.id,
          email: newDbUser.email,
          name: newDbUser.name,
          role: newDbUser.role,
          password: '',
          created_at: new Date(newDbUser.created_at)
        }
      } catch (createError) {
        console.error('❌ [AUTH] Error creating Google user:', createError)
        return null
      }
    }
  } catch (error) {
    console.error('❌ [AUTH] Error in createOrUpdateGoogleUser:', error)
    return null
  }
}