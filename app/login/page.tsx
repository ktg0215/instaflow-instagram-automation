'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SimpleLoginForm from '@/components/SimpleLoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('🔄 Authenticated user detected on login page, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [status, session, router]);

  return <SimpleLoginForm />;
}