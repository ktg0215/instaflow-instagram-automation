import { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { User } from '@/types/auth'

// Direct mock data to avoid dynamic import issues in Edge Runtime
async function getUserFromDatabase(email: string): Promise<User | null> {
  console.log('🔍 [DB] getUserFromDatabase called with email:', email)
  
  try {
    console.log('🔍 [DB] Using mock data for authentication')
    
    // Direct mock data without dynamic imports
    let user: User | null = null
    
    if (email === 'admin@instaflow.com') {
      user = {
        id: 1,
        email: 'admin@instaflow.com',
        password: '$2b$10$BZkNGJLJaeJJB7.pzOtGhO8wB7w2U7FIlkxcVzYoBbNPAUSZRu2TC', // 'admin123'
        name: 'Admin User',
        role: 'admin',
        created_at: new Date()
      }
    } else if (email === 'test@instaflow.com') {
      user = {
        id: 2,
        email: 'test@instaflow.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'test123'
        name: 'Test User',
        role: 'user',
        created_at: new Date()
      }
    } else if (email === 'ktg.shota@gmail.com') {
      user = {
        id: 3,
        email: 'ktg.shota@gmail.com',
        password: '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2', // 'ktg19850215'
        name: 'KTG Admin',
        role: 'admin',
        created_at: new Date()
      }
    }
    
    if (!user) {
      console.log('❌ [DB] No user found for email:', email)
      return null
    }
    
    console.log('✅ [DB] User found:', { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      passwordHash: user.password.substring(0, 10) + '...'
    })
    
    return user
  } catch (error) {
    console.error('❌ [DB] Database error in getUserFromDatabase:', error)
    return null
  }
}

// Google OAuth用のユーザー作成/更新関数
async function createOrUpdateGoogleUser(email: string, name: string): Promise<User | null> {
  try {
    console.log('🔍 [GOOGLE] createOrUpdateGoogleUser called:', { email, name })
    
    // 既存ユーザーをチェック
    const existingUser = await getUserFromDatabase(email)
    
    if (existingUser) {
      console.log('✅ [GOOGLE] Existing user found, updating name')
      // 既存ユーザーの情報を更新（mock環境では名前更新のみシミュレート）
      return {
        ...existingUser,
        name: name // 名前を更新
      }
    } else {
      console.log('✅ [GOOGLE] Creating new Google user')
      // 新規ユーザーを作成（mock環境では固定IDで作成）
      const newUser: User = {
        id: Date.now(), // 簡単なID生成
        email: email,
        name: name,
        role: 'user',
        password: '', // Google認証の場合、パスワードは空
        created_at: new Date()
      }
      return newUser
    }
  } catch (error) {
    console.error('❌ [GOOGLE] Error in createOrUpdateGoogleUser:', error)
    return null
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required for NextAuth v5 in development
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google OAuth の場合、データベースにユーザーを作成/更新
      if (account?.provider === 'google' && user.email && user.name) {
        try {
          const dbUser = await createOrUpdateGoogleUser(user.email, user.name)
          if (dbUser) {
            // ユーザーIDとロールを設定
            user.id = dbUser.id.toString()
            ;(user as any).role = dbUser.role
            return true
          }
          return false
        } catch (error) {
          console.error('Error creating/updating Google user:', error)
          return false
        }
      }
      return true
    },
    jwt({ token, user, account }) {
      console.log('🔍 [JWT] JWT callback called:', { 
        hasUser: !!user, 
        hasAccount: !!account, 
        tokenUserId: token.userId 
      })
      
      // Initial sign in - add custom fields
      if (user) {
        console.log('✅ [JWT] Adding user data to token:', { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: (user as any).role 
        })
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || 'user'
      }
      return token
    },
    session({ session, token }) {
      console.log('🔍 [SESSION] Session callback called:', { 
        hasToken: !!token, 
        hasSession: !!session,
        tokenUserId: token?.userId 
      })
      
      // Send properties to the client
      if (token && session.user) {
        console.log('✅ [SESSION] Creating session with token data')
        session.user.id = token.userId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as any).role = token.role as string
        
        console.log('✅ [SESSION] Final session user:', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role
        })
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
        console.log('🔍 [AUTH] Starting credential authorization...')
        console.log('🔍 [AUTH] Received credentials:', { 
          email: credentials?.email, 
          passwordLength: credentials?.password ? credentials.password.length : 0 
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [AUTH] Missing credentials - email or password empty')
          return null
        }

        try {
          console.log('🔍 [AUTH] Querying database for user:', credentials.email)
          const user = await getUserFromDatabase(credentials.email as string)
          
          if (!user) {
            console.log('❌ [AUTH] User not found in database:', credentials.email)
            return null
          }

          console.log('✅ [AUTH] User found:', { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role,
            hasPassword: !!user.password 
          })

          console.log('🔍 [AUTH] Comparing password...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          console.log('🔍 [AUTH] Password comparison result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ [AUTH] Password validation failed')
            return null
          }

          // Return user object without password
          const authUser = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
          
          console.log('✅ [AUTH] Authentication successful, returning user:', authUser)
          return authUser
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
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development-secret-key-for-nextauth',
}