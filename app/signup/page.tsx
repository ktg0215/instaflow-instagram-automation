'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/LoginForm';

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Back to Landing Page Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 z-10 flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        ホームに戻る
      </button>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <LoginForm initialMode="signup" />
      </div>
    </div>
  );
}