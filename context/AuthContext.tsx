'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  session: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession()
  
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name || '',
    role: (session.user as any).role || 'user'
  } : null

  const loading = status === 'loading'

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error('❌ NextAuth AuthContext: Sign in error:', result.error)
        throw new Error(result.error)
      }

      if (result?.ok) {
        // NextAuth handles the session, redirect via middleware
        if (typeof window !== 'undefined') {
          window.location.replace('/dashboard')
        }
      }
    } catch (error) {
      console.error('❌ NextAuth AuthContext: Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      // Use register endpoint, then sign in
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        let errorMessage = 'サインアップに失敗しました'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          // HTML response or invalid JSON - use default message
        }
        console.error('❌ NextAuth AuthContext: Sign up error:', errorMessage)
        throw new Error(errorMessage)
      }

      // After successful signup, sign in with NextAuth
      await signIn(email, password)
    } catch (error) {
      console.error('❌ NextAuth AuthContext: Sign up error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false })
      if (typeof window !== 'undefined') {
        window.location.replace('/')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      session,
    }}>
      {children}
    </AuthContext.Provider>
  );
};