import React, { useState } from 'react';
import { useInstagram } from '../hooks/useInstagram';
import { useAuth } from '../context/AuthContext';
import { User, Instagram, Bell, Shield, Palette, Zap, Settings as SettingsIcon } from 'lucide-react';
import InstagramConnection from './InstagramConnection';
import AdminSettings from './AdminSettings';
import UserInstagramConnect from './UserInstagramConnect';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { profile: instagramProfile, isConnected } = useInstagram(user?.id ? String(user.id) : undefined);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'ai', label: 'AI設定', icon: Zap },
    { id: 'security', label: 'セキュリティ', icon: Shield },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: '管理者設定', icon: SettingsIcon }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">プロフィール情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
                  <input 
                    type="text" 
                    defaultValue="山田太郎"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                  <input 
                    type="email" 
                    defaultValue="yamada@example.com"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">設定</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">タイムゾーン</span>
                  <select className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80">
                    <option>UTC+9 (JST)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC-5 (EST)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">言語</span>
                  <select className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80">
                    <option>日本語</option>
                    <option>English</option>
                    <option>中文</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div>
            <UserInstagramConnect />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">投稿設定</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">予約投稿の自動公開</span>
                    <p className="text-xs text-gray-500">予約した時間に自動的に投稿を公開します</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">投稿に位置情報を追加</span>
                    <p className="text-xs text-gray-500">投稿に自動的に位置情報を追加します</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">メール通知</h3>
              <div className="space-y-4">
                {[
                  { title: '投稿の公開完了', desc: '投稿が公開されたときに通知を受け取る' },
                  { title: '投稿予約のリマインダー', desc: '予約投稿の予定についてのリマインダー' },
                  { title: '週次パフォーマンス要約', desc: 'Instagramのパフォーマンスに関する週次レポート' },
                  { title: 'AI生成の完了', desc: 'AIコンテンツ生成が完了したときの通知' },
                ].map((notification, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{notification.title}</span>
                      <p className="text-xs text-gray-500">{notification.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI生成設定</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">デフォルトAIモデル</label>
                  <select className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80">
                    <option>GPT-4（推奨）</option>
                    <option>GPT-3.5</option>
                    <option>Claude</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">コンテンツのトーン</label>
                  <select className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80">
                    <option>プロフェッショナル</option>
                    <option>カジュアル</option>
                    <option>インスピレーショナル</option>
                    <option>フレンドリー</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1日あたりの最大AI要求数</label>
                  <input 
                    type="number" 
                    defaultValue="50"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">セキュリティ設定</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">二要素認証</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">二要素認証が有効になっていません</span>
                </div>
                <button className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  2FAを有効にする
                </button>
              </div>
            </div>
          </div>
        );

      case 'admin':
        return <AdminSettings />;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">設定</h2>
          <p className="text-gray-500 mt-1">アカウントとアプリケーションの設定を管理</p>
        </div>
        
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {renderTabContent()}
            
            <div className="mt-8 pt-6 border-t">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                変更を保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;