import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Image, Type, Wand2, Download } from 'lucide-react';

const AIStudio: React.FC = () => {
  const { user } = useAuth();
  const { 
    generateText, 
    generateImage, 
    isGeneratingText,
    isGeneratingImage,
    generatedContent,
    setGeneratedContent
  } = useAI(user?.id);
  
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('プロフェッショナル');
  const [length, setLength] = useState('中程度（3-4文）');
  const [style, setStyle] = useState('リアル');
  const [aspectRatio, setAspectRatio] = useState('1:1（正方形）');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setGeneratedContent(null);
    
    if (activeTab === 'text') {
      generateText({ prompt, options: { tone, length } });
    } else if (activeTab === 'image') {
      generateImage({ prompt, options: { style, aspectRatio } });
    }
  };

  const isGenerating = isGeneratingText || isGeneratingImage;

  const tabs = [
    { id: 'text', label: 'テキスト生成', icon: Type },
    { id: 'image', label: '画像生成', icon: Image },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Studio</h2>
            <p className="text-blue-100">
              AIの力で素晴らしいコンテンツを生成
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-300">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'text' | 'image')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'text' && '書きたい内容を説明してください'}
                  {activeTab === 'image' && '生成したい画像を説明してください'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === 'text' 
                      ? '例：個人の成長と困難を乗り越えることについてのインスピレーションあふれる投稿を書いて'
                      : '例：鮮やかな色彩の山々に沈む美しい夕日'
                  }
                  className="w-full h-32 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none bg-white/90"
                />
              </div>

              {/* Generation Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">設定</h3>
                
                {activeTab === 'text' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">トーン</label>
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option>プロフェッショナル</option>
                        <option>カジュアル</option>
                        <option>インスピレーショナル</option>
                        <option>面白い</option>
                        <option>教育的</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">長さ</label>
                      <select 
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option>短い（1-2文）</option>
                        <option>中程度（3-4文）</option>
                        <option>長い（5文以上）</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'image' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">スタイル</label>
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option>リアル</option>
                        <option>アーティスティック</option>
                        <option>カートゥーン</option>
                        <option>ミニマリスト</option>
                        <option>ヴィンテージ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">アスペクト比</label>
                      <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option>1:1（正方形）</option>
                        <option>4:5（縦長）</option>
                        <option>16:9（横長）</option>
                        <option>9:16（ストーリー）</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>生成</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成されたコンテンツ
                </label>
                <div className="border border-blue-300 rounded-lg p-4 min-h-[200px] bg-blue-50/50">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">素晴らしいコンテンツを作成中...</p>
                      </div>
                    </div>
                  ) : generatedContent ? (
                    <div className="space-y-4">
                      {activeTab === 'text' && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-gray-900">{generatedContent}</p>
                        </div>
                      )}
                      {activeTab === 'image' && (
                        <div className="bg-white p-4 rounded-lg">
                          <img 
                            src={generatedContent} 
                            alt="Generated content" 
                            className="w-full rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>生成されたコンテンツがここに表示されます</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generatedContent && (
                <div className="flex space-x-3">
                  <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>ダウンロード</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <span>投稿に使用</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;