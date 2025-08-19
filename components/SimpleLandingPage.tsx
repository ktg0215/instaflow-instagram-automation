'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const SimpleLandingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Header */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">InstaFlow</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/login')}
                className="text-white/80 hover:text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-white/10"
              >
                ログイン
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                無料で始める
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animations */}
      <section className="pt-32 pb-32 px-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/20 rounded-full text-purple-300 font-medium mb-8 backdrop-blur-sm">
              ✨ AI-Powered Instagram Automation
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
            Instagram管理を
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">自動化</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            AIを活用してInstagramのコンテンツ作成と投稿を効率化
            <br />
            <span className="text-purple-300">時間を節約し、エンゲージメントを最大化</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/signup')}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transform"
            >
              <span className="flex items-center">
                今すぐ始める
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => router.push('/login')}
              className="border-2 border-purple-400/30 text-purple-200 px-10 py-4 rounded-2xl font-semibold text-lg hover:border-purple-400 hover:bg-purple-400/10 transition-all duration-300 backdrop-blur-sm"
            >
              ログイン
            </button>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              主な機能
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              先進のAI技術であなたのInstagram運用を次のレベルへ
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-purple-400/30">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI投稿作成</h3>
              <p className="text-gray-300 leading-relaxed">
                最先端のAIが魅力的なコンテンツを自動生成
                <br />
                <span className="text-purple-300">クリエイティブな投稿を瞬時に作成</span>
              </p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-purple-400/30">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">スケジュール投稿</h3>
              <p className="text-gray-300 leading-relaxed">
                最適なタイミングで自動投稿
                <br />
                <span className="text-blue-300">エンゲージメント率を最大化</span>
              </p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-purple-400/30">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">分析ダッシュボード</h3>
              <p className="text-gray-300 leading-relaxed">
                詳細なパフォーマンス分析とインサイト
                <br />
                <span className="text-green-300">データ駆動型の成長戦略</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">InstaFlow</span>
            </div>
            <p className="text-gray-400 text-lg">
              © 2024 InstaFlow. All rights reserved.
            </p>
            <div className="mt-6 flex justify-center space-x-8">
              <span className="text-gray-500 text-sm">🚀 Made with AI</span>
              <span className="text-gray-500 text-sm">✨ Powered by Innovation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLandingPage;