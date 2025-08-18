'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const SimpleLandingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-purple-600">InstaFlow</span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-700 hover:text-purple-600 px-4 py-2 rounded-lg font-medium"
              >
                ログイン
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                無料で始める
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Simple Hero Section */}
      <section className="pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Instagram管理を自動化
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AIを活用してInstagramのコンテンツ作成と投稿を効率化
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              今すぐ始める
            </button>
            <button
              onClick={() => router.push('/login')}
              className="border border-purple-600 text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50"
            >
              ログイン
            </button>
          </div>
        </div>
      </section>

      {/* Simple Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            主な機能
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI投稿作成</h3>
              <p className="text-gray-600">AIが自動でコンテンツを生成</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">スケジュール投稿</h3>
              <p className="text-gray-600">最適なタイミングで自動投稿</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">分析ダッシュボード</h3>
              <p className="text-gray-600">詳細なパフォーマンス分析</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-8">
            <span className="text-2xl font-bold text-purple-400">InstaFlow</span>
          </div>
          <p className="text-gray-400">
            © 2024 InstaFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLandingPage;