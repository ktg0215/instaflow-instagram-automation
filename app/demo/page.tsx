'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import InstagramPreview from '@/components/InstagramPreview';
import { SwipeableCard, TouchFriendlyButton, BottomSheet, useIsMobile } from '@/components/MobileOptimizations';
import { AccessibleModal, AccessibleToast, SkipLink, useKeyboardNavigation } from '@/components/AccessibilityEnhancements';
import { Play, Code, Smartphone, Accessibility, Palette, Zap, Star } from 'lucide-react';

export default function DemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const isMobile = useIsMobile();
  
  useKeyboardNavigation();

  const features = [
    {
      title: 'ステップバイステップ投稿作成',
      description: 'ユーザーフレンドリーなウィザード形式で、迷うことなく投稿を作成',
      icon: Zap,
      color: 'from-blue-600 to-cyan-600',
      demo: () => window.open('/create', '_blank')
    },
    {
      title: 'リアルタイムプレビュー',
      description: 'Instagram風の美しいプレビューで、投稿前に仕上がりを確認',
      icon: Play,
      color: 'from-purple-600 to-pink-600',
      demo: () => setShowModal(true)
    },
    {
      title: 'インタラクティブ料金プラン',
      description: 'アニメーション豊富で分かりやすい料金プラン選択',
      icon: Star,
      color: 'from-green-600 to-emerald-600',
      demo: () => window.open('/pricing', '_blank')
    },
    {
      title: 'モバイル最適化',
      description: 'スワイプジェスチャー、タッチフレンドリーUI、レスポンシブデザイン',
      icon: Smartphone,
      color: 'from-orange-600 to-red-600',
      demo: () => setShowBottomSheet(true)
    },
    {
      title: 'アクセシビリティ対応',
      description: 'スクリーンリーダー対応、キーボードナビゲーション、WCAG準拠',
      icon: Accessibility,
      color: 'from-indigo-600 to-purple-600',
      demo: () => {
        setToastType('info');
        setShowToast(true);
      }
    },
    {
      title: 'モダンUI/UX',
      description: 'Framer Motionアニメーション、美しいグラデーション、直感的操作',
      icon: Palette,
      color: 'from-pink-600 to-rose-600',
      demo: () => {
        setToastType('success');
        setShowToast(true);
      }
    }
  ];

  const sampleCaption = `新しいInstagram投稿自動化ツールをリリースしました！🚀

✨ AIを活用したキャプション生成
📅 スケジュール投稿機能  
📊 詳細な分析レポート
🎨 美しいプレビュー機能

みなさんのInstagram運用がもっと効率的になりますように！

#Instagram #AI #自動化 #マーケティング #SNS運用`;

  return (
    <Layout currentView="demo">
      <SkipLink href="#main-content">メインコンテンツへスキップ</SkipLink>
      
      <div id="main-content" className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            新機能デモ
          </motion.h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            モダンなUI/UX、アクセシビリティ、モバイル最適化された
            <br />
            次世代Instagram投稿管理システムを体験してください
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <SwipeableCard
                  className="h-full"
                  onSwipeLeft={() => console.log(`Swiped ${feature.title}`)}
                >
                  <div className="bg-white rounded-xl shadow-lg border p-6 h-full hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} mr-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-6 flex-grow">
                      {feature.description}
                    </p>
                    <TouchFriendlyButton
                      onClick={feature.demo}
                      variant="primary"
                      className="w-full"
                      aria-label={`${feature.title}をデモ`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>デモを見る</span>
                      </div>
                    </TouchFriendlyButton>
                  </div>
                </SwipeableCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Device Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg border p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">デバイス情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-2">
                <strong>デバイスタイプ:</strong> {isMobile ? 'モバイル' : 'デスクトップ'}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>画面幅:</strong> {typeof window !== 'undefined' ? window.innerWidth : '不明'}px
              </p>
              <p className="text-gray-600">
                <strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : '不明'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">最適化機能</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ タッチフレンドリーなボタンサイズ (44px+)</li>
                <li>✅ スワイプジェスチャー対応</li>
                <li>✅ レスポンシブレイアウト</li>
                <li>✅ プルトゥリフレッシュ</li>
                <li>✅ ボトムシート</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Accessibility Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">アクセシビリティ機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">実装済み機能</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🎯 キーボードナビゲーション</li>
                <li>📱 スクリーンリーダー対応</li>
                <li>🔍 フォーカスインジケーター</li>
                <li>⏸️ アニメーション停止オプション</li>
                <li>🌓 ハイコントラストモード</li>
                <li>🔤 適切なARIAラベル</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">テスト用ボタン</h3>
              <div className="space-y-2">
                <TouchFriendlyButton
                  onClick={() => {
                    setToastType('success');
                    setShowToast(true);
                  }}
                  variant="secondary"
                  size="sm"
                  aria-label="成功通知をテスト"
                >
                  成功通知テスト
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  onClick={() => {
                    setToastType('error');
                    setShowToast(true);
                  }}
                  variant="danger"
                  size="sm"
                  aria-label="エラー通知をテスト"
                >
                  エラー通知テスト
                </TouchFriendlyButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Demo */}
      <AccessibleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Instagramプレビューデモ"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            このプレビューコンポーネントは実際のInstagramと同じ見た目で投稿を確認できます。
            レスポンシブデザインで、モバイル・デスクトップ両方に対応しています。
          </p>
          <InstagramPreview
            caption={sampleCaption}
            hashtags={['Instagram', 'AI', '自動化', 'マーケティング']}
            username="instaflow_official"
            showEngagement={true}
          />
        </div>
      </AccessibleModal>

      {/* Bottom Sheet Demo */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="モバイル最適化デモ"
        height="half"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            このボトムシートはモバイルに最適化されたUIパターンです。
            ドラッグで閉じることができ、直感的な操作を提供します。
          </p>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">モバイル機能</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>🤏 スワイプジェスチャー</li>
              <li>👆 タッチフレンドリーなボタン</li>
              <li>📱 ボトムシート</li>
              <li>🔄 プルトゥリフレッシュ</li>
              <li>📲 PWA対応準備</li>
            </ul>
          </div>

          <TouchFriendlyButton
            onClick={() => setShowBottomSheet(false)}
            variant="primary"
            className="w-full"
          >
            閉じる
          </TouchFriendlyButton>
        </div>
      </BottomSheet>

      {/* Toast Notification */}
      <AccessibleToast
        type={toastType}
        title={toastType === 'success' ? '機能デモ成功' : toastType === 'error' ? 'エラー通知デモ' : '情報通知デモ'}
        message={
          toastType === 'success' 
            ? '全ての新機能が正常に動作しています！' 
            : toastType === 'error'
            ? 'これはエラー通知のデモです。実際のエラーではありません。'
            : 'アクセシビリティ機能が有効になっています。'
        }
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </Layout>
  );
}