import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface ApiSetting {
  setting_key: string;
  setting_value: string;
  description: string;
}

const AdminSettings: React.FC = () => {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'API設定の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value })
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      setSettings(prev => 
        prev.map(setting => 
          setting.setting_key === key 
            ? { ...setting, setting_value: value }
            : setting
        )
      );

      setMessage({ type: 'success', text: '設定を保存しました' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getDisplayName = (key: string) => {
    const names: Record<string, string> = {
      'openai_api_key': 'OpenAI API Key',
      'instagram_app_id': 'Instagram App ID',
      'instagram_app_secret': 'Instagram App Secret',
      'facebook_app_id': 'Facebook App ID',
      'facebook_app_secret': 'Facebook App Secret'
    };
    return names[key] || key;
  };

  const isSecretField = (key: string) => {
    return key.includes('secret') || key.includes('key');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">管理者権限が必要です</h3>
        <p className="text-red-600">この機能は管理者のみが利用できます。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">設定を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <Shield className="w-8 h-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">管理者設定</h2>
            <p className="text-red-100 mt-1">システム全体のAPI設定を管理します</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* API Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            API設定
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            外部サービスとの連携に必要なAPI キーとシークレットを設定します
          </p>
        </div>

        <div className="p-6 space-y-6">
          {settings.map((setting) => (
            <div key={setting.setting_key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {getDisplayName(setting.setting_key)}
              </label>
              <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
              
              <div className="relative">
                <input
                  type={isSecretField(setting.setting_key) && !showValues[setting.setting_key] ? 'password' : 'text'}
                  value={setting.setting_value}
                  onChange={(e) => {
                    setSettings(prev => 
                      prev.map(s => 
                        s.setting_key === setting.setting_key 
                          ? { ...s, setting_value: e.target.value }
                          : s
                      )
                    );
                  }}
                  placeholder={`${getDisplayName(setting.setting_key)}を入力`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  {isSecretField(setting.setting_key) && (
                    <button
                      type="button"
                      onClick={() => toggleShowValue(setting.setting_key)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showValues[setting.setting_key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => updateSetting(setting.setting_key, setting.setting_value)}
                    disabled={saving}
                    className="p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-800 mb-3">設定ガイド</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <p><strong>OpenAI API Key:</strong> AI機能に使用。OpenAIのダッシュボードから取得してください。</p>
          <p><strong>Instagram App ID/Secret:</strong> Instagram Basic Displayから取得。一般ユーザーのログインに使用。</p>
          <p><strong>Facebook App ID/Secret:</strong> Instagram Business APIから取得。ビジネス機能に使用。</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;