'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Instagram, 
  Bot, 
  Calendar, 
  BarChart3, 
  Zap, 
  Users, 
  TrendingUp, 
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Play,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Camera,
  Image as ImageIcon,
  Video,
  Eye,
  Target,
  Rocket,
  Infinity,
  Shield,
  Clock
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSection, setVisibleSection] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      let startTime: number;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        }
      };
      requestAnimationFrame(animateCount);
    }, [end, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
  };

  const InstagramPostMock = ({ avatar, username, image, likes, comments }: {
    avatar: string;
    username: string;
    image: string;
    likes: number;
    comments: number;
  }) => (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
      <div className="p-4 flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${avatar} flex items-center justify-center`}>
          <span className="text-white font-semibold text-sm">{username[0]}</span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{username}</h4>
          <p className="text-xs text-gray-500">2分前</p>
        </div>
      </div>
      <div className={`h-64 bg-gradient-to-br ${image} flex items-center justify-center`}>
        <ImageIcon className="w-16 h-16 text-white/50" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Heart className="w-6 h-6 text-gray-700 hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle className="w-6 h-6 text-gray-700 hover:text-blue-500 cursor-pointer transition-colors" />
            <Share className="w-6 h-6 text-gray-700 hover:text-green-500 cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-6 h-6 text-gray-700 hover:text-yellow-500 cursor-pointer transition-colors" />
        </div>
        <p className="font-semibold text-sm text-gray-900 mb-1">{likes.toLocaleString()}いいね</p>
        <p className="text-sm text-gray-600">すべてのコメント({comments}件)を見る</p>
      </div>
    </div>
  );

  const features = [
    {
      icon: Bot,
      title: 'AI コンテンツ生成',
      description: 'Google Gemini AIがブランドに合わせた魅力的な投稿を自動生成。あなただけのコンテンツが無限に作れます',
      gradient: 'from-purple-500 to-pink-500',
      delay: '0.1s'
    },
    {
      icon: Calendar,
      title: '最適タイミング投稿',
      description: 'AIがフォロワーの活動パターンを分析し、エンゲージメント最大化のタイミングで自動投稿',
      gradient: 'from-blue-500 to-purple-500',
      delay: '0.2s'
    },
    {
      icon: BarChart3,
      title: '詳細分析ダッシュボード',
      description: 'リーチ、インプレッション、エンゲージメント率を美しいチャートで可視化。成長が一目でわかる',
      gradient: 'from-green-500 to-blue-500',
      delay: '0.3s'
    },
    {
      icon: Target,
      title: 'ハッシュタグ最適化',
      description: 'トレンドを分析してベストなハッシュタグを提案。リーチを劇的に拡大します',
      gradient: 'from-orange-500 to-pink-500',
      delay: '0.4s'
    },
    {
      icon: Users,
      title: 'チーム管理',
      description: '複数メンバーでの協働、承認フロー、役割管理。企業レベルのInstagram運用を実現',
      gradient: 'from-teal-500 to-green-500',
      delay: '0.5s'
    },
    {
      icon: Rocket,
      title: '成長加速エンジン',
      description: 'フォロワー増加、エンゲージメント向上のための戦略をAIが自動提案。成長を加速',
      gradient: 'from-red-500 to-orange-500',
      delay: '0.6s'
    }
  ];

  const testimonials = [
    {
      name: '田中 美咲',
      role: 'インフルエンサー・フォロワー50万人',
      content: 'InstaFlowのAIは私の個性を完璧に理解してくれます。投稿の質が劇的に向上し、エンゲージメント率が300%アップしました。もう手放せません。',
      rating: 5,
      avatar: 'from-pink-400 to-purple-500',
      growth: '+300% エンゲージメント'
    },
    {
      name: '佐藤 健太',
      role: 'マーケティング責任者・化粧品ブランド',
      content: '15個のアカウントを一元管理できるようになり、チーム全体の生産性が5倍向上。ROIも大幅改善で、売上に直結しています。',
      rating: 5,
      avatar: 'from-blue-500 to-purple-600',
      growth: '+500% 生産性向上'
    },
    {
      name: '山田 花子',
      role: 'ECショップオーナー・月商1000万',
      content: 'AIの投稿予約機能で24時間365日、常に最適なタイミングで投稿。フォロワーが月1万人ずつ増加し、売上も右肩上がりです。',
      rating: 5,
      avatar: 'from-green-500 to-teal-600',
      growth: '+1万人/月 フォロワー増'
    }
  ];

  const pricingPlans = [
    {
      name: 'スターター',
      price: '無料',
      period: '',
      originalPrice: null,
      features: [
        '月間10投稿まで',
        '基本AI生成機能',
        '1アカウント管理',
        '基本分析レポート',
        'コミュニティサポート'
      ],
      cta: '無料で始める',
      popular: false,
      gradient: 'from-gray-100 to-gray-200',
      textColor: 'text-gray-900'
    },
    {
      name: 'プロ',
      price: '¥2,980',
      period: '/月',
      originalPrice: '¥4,980',
      features: [
        '月間100投稿まで',
        '高度なAI生成',
        '3アカウント管理',
        '詳細分析ダッシュボード',
        'AIハッシュタグ提案',
        '最適投稿時間分析',
        'チームコラボレーション',
        'メールサポート'
      ],
      cta: 'プロを始める',
      popular: true,
      gradient: 'from-purple-600 via-pink-600 to-orange-500',
      textColor: 'text-white'
    },
    {
      name: 'エンタープライズ',
      price: '¥9,980',
      period: '/月',
      originalPrice: '¥19,980',
      features: [
        '無制限投稿',
        'カスタムAI設定',
        '無制限アカウント',
        'カスタムダッシュボード',
        'API アクセス',
        '専任アカウントマネージャー',
        '優先サポート',
        'カスタム統合'
      ],
      cta: 'エンタープライズを始める',
      popular: false,
      gradient: 'from-gray-900 via-purple-900 to-blue-900',
      textColor: 'text-white'
    }
  ];

  const stats = [
    { label: 'アクティブユーザー', value: 50000, suffix: '+' },
    { label: '月間投稿数', value: 1000000, suffix: '+' },
    { label: '平均エンゲージメント向上', value: 245, suffix: '%' },
    { label: '顧客満足度', value: 98, suffix: '%' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 left-40 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">IF</span>
              </div>
              <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">InstaFlow</span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-700 hover:text-purple-600 px-4 py-2 rounded-xl font-medium transition-all duration-200"
              >
                ログイン
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                無料で始める
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm font-medium px-6 py-3 rounded-full mb-8 shadow-lg border border-purple-200">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              AI powered Instagram automation platform
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            AIが創る、<br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent animate-pulse">
              魔法のInstagram運用
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
            Google Gemini AIと最新のマーケティング技術で、あなたのInstagramを
            <span className="font-semibold text-purple-600">自動的に成長させる</span>プラットフォーム。
            投稿作成から分析まで、すべてをAIがサポート。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button
              onClick={() => router.push('/signup')}
              className="group bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-12 py-5 rounded-3xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-xl flex items-center justify-center"
            >
              <Rocket className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
              無料で始める
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="group border-2 border-gray-300 text-gray-800 px-12 py-5 rounded-3xl font-bold text-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-300 flex items-center justify-center">
              <Play className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
              デモを見る
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InstagramPostMock 
                  avatar="from-pink-500 to-purple-600"
                  username="beauty_brand_official"
                  image="from-pink-200 to-purple-300"
                  likes={15420}
                  comments={342}
                />
                <InstagramPostMock 
                  avatar="from-blue-500 to-teal-600"
                  username="travel_adventures"
                  image="from-blue-200 to-teal-300"
                  likes={8930}
                  comments={156}
                />
                <InstagramPostMock 
                  avatar="from-orange-500 to-red-600"
                  username="food_paradise"
                  image="from-orange-200 to-red-300"
                  likes={23710}
                  comments={487}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              パワフルな機能で
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Instagram運用を革命化
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI技術とInstagram Graph APIの完全統合により、プロレベルのInstagram運用を誰でも簡単に実現できます
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              お客様の成功ストーリー
            </h2>
            <p className="text-xl text-white/90">
              InstaFlowで実際に成果を上げている皆様の声をお聞きください
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-14 h-14 bg-gradient-to-r ${testimonial.avatar} rounded-full flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {testimonial.growth}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              シンプルで透明な
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                料金プラン
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              あなたのビジネスに最適なプランを選択してください。いつでもプラン変更可能です
            </p>
            <div className="bg-green-100 text-green-800 px-6 py-3 rounded-full inline-block font-semibold">
              🎉 期間限定: 初月50%OFF キャンペーン実施中！
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'border-purple-500 shadow-2xl' 
                    : 'border-gray-200 shadow-lg hover:border-purple-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      🔥 最も人気
                    </div>
                  </div>
                )}
                
                {plan.popular && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${plan.gradient} rounded-3xl`}></div>
                )}
                
                <div className={`text-center mb-8 ${plan.popular ? 'relative' : ''}`}>
                  <h3 className={`text-2xl font-bold mb-4 ${plan.popular ? plan.textColor : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    {plan.originalPrice && (
                      <div className={`text-lg line-through ${plan.popular ? 'text-white/60' : 'text-gray-400'} mb-2`}>
                        {plan.originalPrice}
                      </div>
                    )}
                    <span className={`text-5xl font-bold ${plan.popular ? plan.textColor : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`ml-2 ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className={`w-5 h-5 mr-3 ${plan.popular ? 'text-white' : 'text-green-500'}`} />
                      <span className={`${plan.popular ? plan.textColor : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => {
                    if (plan.cta === '無料で始める') {
                      router.push('/signup');
                    } else {
                      router.push('/signup');
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-purple-600 hover:bg-gray-100 shadow-lg'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              すべてのプランに30日間の返金保証付き。クレジットカード不要で始められます。
            </p>
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">SSL暗号化</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">24/7サポート</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600">30日間返金保証</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Infinity className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-pulse" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            今すぐInstagram運用を
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              次のレベルへ
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            無料プランで今すぐ始めて、AIの力でInstagramマーケティングを変革しましょう。
            <br />
            数千社が選んだ信頼のプラットフォームで、あなたも成功への第一歩を踏み出してください。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push('/signup')}
              className="group bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-12 py-5 rounded-3xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-xl flex items-center justify-center"
            >
              <Rocket className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
              無料で今すぐ始める
              <Sparkles className="ml-3 w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <button className="group border-2 border-white/30 text-white px-12 py-5 rounded-3xl font-bold text-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
              <Eye className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
              詳細を見る
            </button>
          </div>
          
          <div className="mt-12">
            <p className="text-gray-400 text-sm">
              クレジットカード不要 • 30秒で開始 • いつでもキャンセル可能
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-8 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">IF</span>
              </div>
              <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">InstaFlow</span>
            </div>
            
            <div className="flex flex-wrap justify-center space-x-8">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors font-medium">プライバシー</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors font-medium">利用規約</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors font-medium">サポート</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors font-medium">API</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors font-medium">ブログ</a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 InstaFlow. All rights reserved. Made with ❤️ for Instagram creators.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Instagram is a trademark of Meta Platforms, Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;