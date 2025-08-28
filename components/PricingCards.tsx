'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Check, Star, Zap, Crown, Sparkles, ArrowRight, 
  Users, Calendar, BarChart3, Bot, Hash, Image, 
  Shield, Clock, Headphones, Rocket, Gift
} from 'lucide-react';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  features: PlanFeature[];
  popular?: boolean;
  recommended?: boolean;
  buttonText: string;
  maxPosts: number;
  maxHashtags: number;
  aiRequests: number;
}

const PricingCards: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'フリー',
      price: 0,
      period: '月',
      description: '個人利用に最適なスタータープラン',
      icon: Users,
      color: 'gray',
      gradientFrom: 'from-gray-500',
      gradientTo: 'to-gray-600',
      features: [
        { text: '月5投稿まで', included: true },
        { text: '基本ハッシュタグ（20個）', included: true },
        { text: 'AI生成（月10回）', included: true },
        { text: '投稿予約機能', included: true },
        { text: 'コミュニティサポート', included: true },
        { text: '高度な分析機能', included: false },
        { text: 'カスタムハッシュタグ', included: false },
        { text: '優先サポート', included: false },
      ],
      buttonText: '無料で始める',
      maxPosts: 5,
      maxHashtags: 20,
      aiRequests: 10
    },
    {
      id: 'pro',
      name: 'プロ',
      price: billingPeriod === 'monthly' ? 2980 : 1980,
      originalPrice: billingPeriod === 'yearly' ? 2980 : undefined,
      period: '月',
      description: 'クリエイター・小規模ビジネス向け',
      icon: Zap,
      color: 'blue',
      gradientFrom: 'from-blue-600',
      gradientTo: 'to-cyan-600',
      popular: true,
      features: [
        { text: '月50投稿まで', included: true, highlight: true },
        { text: '全ハッシュタグ利用可能', included: true, highlight: true },
        { text: 'AI生成無制限', included: true, highlight: true },
        { text: '高度な投稿予約機能', included: true },
        { text: '詳細分析レポート', included: true },
        { text: 'インスタグラム連携', included: true },
        { text: 'メールサポート', included: true },
        { text: '広告なし体験', included: true },
      ],
      buttonText: 'プロを始める',
      maxPosts: 50,
      maxHashtags: -1,
      aiRequests: -1
    },
    {
      id: 'business',
      name: 'ビジネス',
      price: billingPeriod === 'monthly' ? 9800 : 6800,
      originalPrice: billingPeriod === 'yearly' ? 9800 : undefined,
      period: '月',
      description: '企業・代理店向けプレミアムプラン',
      icon: Crown,
      color: 'purple',
      gradientFrom: 'from-purple-600',
      gradientTo: 'to-pink-600',
      recommended: true,
      features: [
        { text: '無制限投稿', included: true, highlight: true },
        { text: 'カスタムハッシュタグセット', included: true, highlight: true },
        { text: 'AI生成無制限', included: true, highlight: true },
        { text: 'チーム管理機能', included: true, highlight: true },
        { text: 'API連携', included: true },
        { text: '詳細分析・レポート', included: true },
        { text: '優先サポート（24時間以内）', included: true },
        { text: 'ホワイトラベル利用', included: true },
      ],
      buttonText: 'ビジネスを始める',
      maxPosts: -1,
      maxHashtags: -1,
      aiRequests: -1
    }
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      if (!user) {
        router.push('/signup');
      } else {
        router.push('/dashboard');
      }
    } else {
      // 有料プランの場合は決済ページに遷移
      router.push(`/checkout?plan=${planId}&billing=${billingPeriod}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            あなたにぴったりのプランを選択
          </motion.h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AIを活用したInstagram投稿自動化で、より効果的なソーシャルメディアマーケティングを実現しましょう
          </p>

          {/* Billing Toggle */}
          <motion.div 
            className="flex items-center justify-center space-x-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              月払い
            </span>
            <motion.button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              年払い
            </span>
            {billingPeriod === 'yearly' && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center"
              >
                <Gift className="w-3 h-3 mr-1" />
                33% OFF
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                variants={cardVariants}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  plan.popular ? 'border-blue-500 shadow-blue-100' :
                  plan.recommended ? 'border-purple-500 shadow-purple-100' :
                  'border-gray-200 hover:border-gray-300'
                } ${isHovered ? 'scale-105 shadow-2xl' : ''}`}
                whileHover={{ y: -5 }}
                layout
              >
                {/* Popular/Recommended Badge */}
                <AnimatePresence>
                  {(plan.popular || plan.recommended) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-medium shadow-lg ${
                        plan.popular ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                        'bg-gradient-to-r from-purple-600 to-pink-600'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        {plan.popular && <Star className="w-3 h-3" />}
                        {plan.recommended && <Crown className="w-3 h-3" />}
                        <span>{plan.popular ? '人気' : 'おすすめ'}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <motion.div 
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        {plan.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ¥{plan.originalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-gray-900">
                          ¥{plan.price.toLocaleString()}
                        </span>
                        <span className="text-gray-600">/{plan.period}</span>
                      </div>
                      {billingPeriod === 'yearly' && plan.originalPrice && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-green-600 text-sm font-medium mt-1"
                        >
                          年間¥{((plan.originalPrice - plan.price) * 12).toLocaleString()}お得！
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * featureIndex }}
                        className="flex items-start space-x-3"
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          feature.included 
                            ? feature.highlight 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}>
                          <Check className={`w-3 h-3 ${
                            feature.included ? 'text-white' : 'text-gray-400'
                          }`} />
                        </div>
                        <span className={`text-sm ${
                          feature.included 
                            ? feature.highlight 
                              ? 'text-gray-900 font-medium' 
                              : 'text-gray-700'
                            : 'text-gray-400'
                        }`}>
                          {feature.text}
                        </span>
                        {feature.highlight && (
                          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-4 px-6 rounded-xl font-medium text-center transition-all duration-300 ${
                      plan.id === 'free'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : `bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-white shadow-lg hover:shadow-xl`
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>{plan.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.button>

                  {/* Plan Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {plan.maxPosts === -1 ? '∞' : plan.maxPosts}
                        </div>
                        <div className="text-xs text-gray-500">投稿/月</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {plan.maxHashtags === -1 ? '∞' : plan.maxHashtags}
                        </div>
                        <div className="text-xs text-gray-500">ハッシュタグ</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {plan.aiRequests === -1 ? '∞' : plan.aiRequests}
                        </div>
                        <div className="text-xs text-gray-500">AI生成/月</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature Comparison */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-16"
        >
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            詳細機能比較
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-900">機能</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-medium text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: '月間投稿数', values: ['5投稿', '50投稿', '無制限'] },
                  { feature: 'AI生成回数', values: ['10回/月', '無制限', '無制限'] },
                  { feature: 'ハッシュタグ数', values: ['20個', '全て利用可能', '全て利用可能'] },
                  { feature: 'Instagram連携', values: ['○', '○', '○'] },
                  { feature: '投稿予約', values: ['○', '○', '○'] },
                  { feature: '分析レポート', values: ['×', '○', '○'] },
                  { feature: 'チーム管理', values: ['×', '×', '○'] },
                  { feature: '優先サポート', values: ['×', '○', '○'] },
                  { feature: 'API連携', values: ['×', '×', '○'] },
                ].map((row, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {row.feature}
                    </td>
                    {row.values.map((value, valueIndex) => (
                      <td key={valueIndex} className="text-center py-4 px-4">
                        {value === '○' ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : value === '×' ? (
                          <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                        ) : (
                          <span className="text-gray-700">{value}</span>
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            よくある質問
          </h2>
          <p className="text-gray-600 mb-8">
            プランについてご不明な点がございましたら、お気軽にお問い合わせください。
          </p>
          <motion.button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/support')}
          >
            <div className="flex items-center space-x-2">
              <Headphones className="w-5 h-5" />
              <span>サポートに相談</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingCards;