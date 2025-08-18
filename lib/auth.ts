import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextRequest } from 'next/server'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Helper function for API route authentication
export async function verifyAuth(request: NextRequest) {
  try {
    // In API routes, we need to extract session from request
    const cookieHeader = request.headers.get('cookie')
    
    if (!cookieHeader) {
      return null
    }
    
    // Create a mock request object for auth() function
    const mockReq = {
      headers: {
        get: (name: string) => request.headers.get(name),
        cookie: cookieHeader
      },
      url: request.url,
      method: request.method
    }
    
    // Get session using NextAuth with request context
    const session = await auth()
    
    if (!session?.user) {
      return null
    }
    
    return {
      id: session.user.id || session.user.email,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role || 'user'
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}