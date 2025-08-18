import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { usePosts } from '../hooks/usePosts';
import { useHashtags } from '../hooks/useHashtags';
import { useToast } from '../context/ToastContext';
import HashtagManager from './HashtagManager';
import ScheduleManager from './ScheduleManager';
import { Upload, Image, Video, Calendar, Hash, Send, MessageCircle, Bot, User, Settings, Clock, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const { isConnected: instagramConnected, publishToInstagram } = useInstagram(user?.id ? String(user.id) : undefined);
  const { generateText, isGeneratingText, generatedContent, setGeneratedContent } = useAI(user?.id ? String(user.id) : undefined);
  const { createPost, isCreating, createError } = usePosts();
  const { hashtags } = useHashtags();
  const { showToast } = useToast();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'carousel'>('image');
  const [scheduledAt, setScheduledAt] = useState('');
  const [tone, setTone] = useState('プロフェッショナル');
  const [length, setLength] = useState('中程度（3-4文）');

  // UI State
  const [activeTab, setActiveTab] = useState<'create' | 'hashtags' | 'schedule'>('create');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [useHashtagsForAI, setUseHashtagsForAI] = useState(true);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'こんにちは！素晴らしいキャプションを一緒に作りましょう。投稿の内容やテーマについて教えてください。どんな雰囲気にしたいですか？',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック (10MB制限)
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'ファイルサイズエラー',
          message: 'ファイルサイズは10MB以下にしてください'
        });
        return;
      }

      // ファイルタイプチェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        showToast({
          type: 'error',
          title: 'ファイルタイプエラー',
          message: 'JPG、PNG、GIF、MP4、MOVファイルのみアップロード可能です'
        });
        return;
      }

      // ファイルを読み込んでプレビューを表示
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrl(event.target.result as string);
          setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
        }
      };
      reader.readAsDataURL(file);

      showToast({
        type: 'success',
        title: 'アップロード完了',
        message: `${file.name} をアップロードしました`
      });
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caption.trim()) {
      showToast({
        type: 'warning',
        title: '入力エラー',
        message: 'キャプションを入力してください'
      });
      return;
    }
    
    // 選択されたハッシュタグを含む最終キャプション
    const finalCaption = selectedHashtags.length > 0 
      ? `${caption.trim()}\n\n${selectedHashtags.map(tag => `#${tag}`).join(' ')}`
      : caption.trim();
    
    const postData = {
      caption: finalCaption,
      image_url: mediaUrl || null,
      scheduled_at: scheduledAt || null,
      status: scheduledAt ? 'scheduled' as const : 'draft' as const,
    };

    try {
      createPost(postData);
      
      // Reset form
      setCaption('');
      setMediaUrl('');
      setScheduledAt('');
      setSelectedHashtags([]);
      
      showToast({
        type: 'success',
        title: '投稿作成完了',
        message: scheduledAt ? '投稿が予約されました' : '投稿が下書きとして保存されました'
      });
    } catch (error) {
      console.error('投稿作成エラー:', error);
      showToast({
        type: 'error',
        title: '投稿作成失敗',
        message: error instanceof Error ? error.message : '投稿の作成に失敗しました'
      });
    }
  };

  const handlePublishNow = async () => {
    if (!caption.trim()) {
      showToast({
        type: 'warning',
        title: '入力エラー',
        message: 'キャプションを入力してください'
      });
      return;
    }

    if (!instagramConnected) {
      showToast({
        type: 'info',
        title: 'Instagram未接続',
        message: '設定ページでInstagramアカウントを接続してください'
      });
      return;
    }

    try {
      // 選択されたハッシュタグを含む最終キャプション
      const finalCaption = selectedHashtags.length > 0 
        ? `${caption.trim()}\n\n${selectedHashtags.map(tag => `#${tag}`).join(' ')}`
        : caption.trim();

      // データベースに保存（今すぐ公開として）
      const postData = {
        caption: finalCaption,
        image_url: mediaUrl || null,
        status: 'published' as const,
      };

      createPost(postData);

      // Instagram API連携は Phase 7 で実装予定
      // const instagramPostId = await publishToInstagram({
      //   mediaUrl,
      //   caption: finalCaption,
      //   mediaType: mediaType === 'video' ? 'video' : 'image'
      // });
      
      // Reset form
      setCaption('');
      setMediaUrl('');
      setScheduledAt('');
      setSelectedHashtags([]);
      
      showToast({
        type: 'success',
        title: '投稿公開完了',
        message: 'Instagram連携はPhase 7で実装予定です'
      });
    } catch (error) {
      console.error('Publish error:', error);
      showToast({
        type: 'error',
        title: '投稿公開失敗',
        message: error instanceof Error ? error.message : '投稿の公開に失敗しました'
      });
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');

    // Generate AI response
    const selectedHashtagsInfo = useHashtagsForAI && selectedHashtags.length > 0 
      ? `\n\n選択されたハッシュタグ: ${selectedHashtags.map(tag => `#${tag}`).join(' ')}\n（これらのハッシュタグを考慮してキャプションを作成してください）`
      : '';

    const contextPrompt = `
ユーザーからの質問: ${currentInput}

これまでの会話:
${chatMessages.slice(-3).map(msg => `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`).join('\n')}${selectedHashtagsInfo}

あなたはInstagramキャプション作成の専門家です。ユーザーの質問に対して、以下の点を考慮して回答してください：
- キャプション作成のアドバイス
- ハッシュタグの提案
- エンゲージメントを高める方法
- トーンや雰囲気の調整
- 具体的なキャプション例の提供

親しみやすく、実用的なアドバイスを日本語で提供してください。キャプション例を提供する場合は「例：」で始めてください。
`;

    try {
      generateText({ prompt: contextPrompt, options: { tone: 'フレンドリー', length: '中程度（3-4文）' } });
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'すみません、一時的にエラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // AI生成結果をチャットに追加
  React.useEffect(() => {
    if (generatedContent) {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: generatedContent,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setGeneratedContent(null);
    }
  }, [generatedContent, setGeneratedContent]);

  const setCaptionFromChat = (content: string) => {
    // Extract caption from AI response
    const lines = content.split('\n');
    const captionLine = lines.find(line => 
      line.includes('例：') || 
      line.includes('「') && line.includes('」') ||
      line.includes('キャプション')
    );
    
    if (captionLine) {
      // Extract text between quotes or after "例："
      const match = captionLine.match(/例：(.+)/) || 
                   captionLine.match(/[「『]([^」』]+)[」』]/) ||
                   [null, captionLine.replace(/^.*?キャプション[：:]\s*/, '')];
      if (match && match[1]) {
        setCaption(match[1].trim());
      }
    } else {
      // Use the whole content if no specific caption format found
      setCaption(content);
    }
  };

  const sampleImages = [
    'https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1526814/pexels-photo-1526814.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-300">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">投稿作成スタジオ</h2>
          <p className="text-gray-500 mt-1">AI支援、ハッシュタグ管理、予約投稿機能を活用しましょう</p>
          
          {/* タブナビゲーション */}
          <div className="flex space-x-1 mt-4 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline-block mr-2" />
              投稿作成
            </button>
            <button
              onClick={() => setActiveTab('hashtags')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'hashtags'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Hash className="w-4 h-4 inline-block mr-2" />
              ハッシュタグ管理
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-2" />
              予約管理
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* タブコンテンツ */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Media Upload */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メディアコンテンツ
                </label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/50">
                  {mediaUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={mediaUrl} 
                        alt="アップロードプレビュー" 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaUrl('')}
                        className="text-sm text-gray-500 hover:text-red-500"
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-600">メディアをアップロード</p>
                        <p className="text-sm text-gray-500">JPG、PNG、MP4（最大10MB）</p>
                      </div>
                      
                      {/* File Upload Input */}
                      <div className="space-y-3">
                        <input
                          type="file"
                          id="media-upload"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="media-upload"
                          className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-center transition-colors"
                        >
                          ファイルを選択
                        </label>
                        
                        <div className="text-center text-gray-400">または</div>
                        
                        <input
                          type="url"
                          placeholder="画像URLを貼り付け"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white/80"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  クイック選択
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setMediaUrl(url)}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img src={url} alt={`Sample ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投稿タイプ
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'image', label: '写真', icon: Image },
                    { value: 'video', label: '動画', icon: Video },
                    { value: 'carousel', label: 'カルーセル', icon: Hash },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMediaType(type.value as 'image' | 'video' | 'carousel')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                          mediaType === type.value
                            ? 'bg-blue-100 border-blue-600 text-blue-800'
                            : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle Column - Caption & AI Chat */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    キャプション
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {isChatExpanded ? 'チャットを閉じる' : 'AIチャット'}
                    </span>
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={handleCaptionChange}
                  placeholder="キャプションを入力してください... ハッシュタグを使ってより多くの人にリーチしましょう！"
                  className="w-full h-32 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none bg-white/90"
                  maxLength={2200}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {caption.length}/2200 文字
                  </span>
                  <span className="text-sm text-gray-500">
                    {(caption.match(/#\w+/g) || []).length} ハッシュタグ
                  </span>
                </div>
              </div>

              {/* AI Generation Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">AI生成設定</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">トーン</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option>短い（1-2文）</option>
                      <option>中程度（3-4文）</option>
                      <option>長い（5文以上）</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useHashtagsForAI"
                    checked={useHashtagsForAI}
                    onChange={(e) => setUseHashtagsForAI(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="useHashtagsForAI" className="text-xs text-gray-600">
                    選択したハッシュタグをAI生成に活用
                  </label>
                </div>
              </div>

              {/* Selected Hashtags Display */}
              {selectedHashtags.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    選択中のハッシュタグ ({selectedHashtags.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => setSelectedHashtags(prev => prev.filter(t => t !== tag))}
                          className="hover:bg-blue-700 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('hashtags')}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    ハッシュタグを管理
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投稿予約（オプション）
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white/90"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  空欄にすると下書きとして保存されます
                </p>
              </div>
            </div>

            {/* Right Column - Instagram Preview & AI Chat */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagramプレビュー
                </label>
                <div className="bg-black rounded-lg p-4 max-w-sm mx-auto">
                  <div className="bg-white rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center p-3 border-b">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"></div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold">your_username</p>
                      </div>
                    </div>
                    
                    {/* Media */}
                    {mediaUrl && (
                      <div className="aspect-square bg-gray-100">
                        <img 
                          src={mediaUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Caption */}
                    <div className="p-3">
                      <p className="text-sm">
                        <span className="font-semibold">your_username</span>{' '}
                        {caption || 'キャプションがここに表示されます...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Chat Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="p-4 border-b border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-medium text-purple-800">AIキャプションアシスタント</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChatExpanded(!isChatExpanded)}
                      className="text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  {!isChatExpanded && (
                    <div className="mt-2 space-y-1 text-xs text-purple-700">
                      <p>• 「カフェの写真にぴったりなキャプションを作って」</p>
                      <p>• 「もっとカジュアルなトーンにして」</p>
                      <p>• 「ハッシュタグを追加して」</p>
                    </div>
                  )}
                </div>

                {/* Chat Messages - Only show when expanded */}
                {isChatExpanded && (
                  <>
                    <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-lg text-sm ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-purple-200 text-gray-800'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              {message.role === 'assistant' && <Bot className="w-4 h-4 mt-0.5 text-purple-600" />}
                              {message.role === 'user' && <User className="w-4 h-4 mt-0.5" />}
                              <div className="flex-1">
                                <p className="leading-relaxed">{message.content}</p>
                                {message.role === 'assistant' && (
                                  <button
                                    type="button"
                                    onClick={() => setCaptionFromChat(message.content)}
                                    className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors font-medium"
                                  >
                                    ✨ キャプションに使用
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isGeneratingText && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-purple-200 text-gray-800 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Bot className="w-4 h-4 text-purple-600" />
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-purple-600">考え中...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat Input */}
                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-purple-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="AIに質問してください..."
                          className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={isGeneratingText}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isGeneratingText}
                          className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={isCreating || !caption.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '処理中...' : '今すぐ公開'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !caption.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '処理中...' : (scheduledAt ? '投稿を予約' : '下書き保存')}
                </button>
              </div>
            </form>
          )}

          {/* ハッシュタグ管理タブ */}
          {activeTab === 'hashtags' && (
            <HashtagManager
              showSelection={true}
              selectedHashtags={selectedHashtags}
              onSelectHashtags={setSelectedHashtags}
            />
          )}

          {/* 予約管理タブ */}
          {activeTab === 'schedule' && (
            <ScheduleManager />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;