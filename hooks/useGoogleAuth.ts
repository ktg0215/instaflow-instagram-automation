'use client'

import { useState } from 'react'

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false)

  const signInWithGoogle = async () => {
    setIsLoading(true)
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google?action=signin'
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const signUpWithGoogle = async () => {
    setIsLoading(true)
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google?action=signup'
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  return {
    signInWithGoogle,
    signUpWithGoogle,
    isLoading,
  }
}