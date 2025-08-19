import React, { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { usePosts } from '../hooks/usePosts';
import { useHashtags } from '../hooks/useHashtags';
import { useToast } from '../context/ToastContext';
import HashtagManager from './HashtagManager';
import { 
  Upload, Image, Video, Calendar, Hash, Send, MessageCircle, Bot, User, Settings, Clock, X, 
  Check, ChevronDown, ChevronRight, Smartphone, Monitor, Eye, Save, Zap, Sparkles, 
  HelpCircle, Target, Palette, Tag, Plus, RefreshCw, Trash2
} from 'lucide-react';

type PostPurpose = '認知向上' | '商品紹介' | 'エンゲージメント' | '告知' | '日常投稿';
type PostTone = 'カジュアル' | 'フォーマル' | '親しみやすい' | 'プロフェッショナル' | 'ユーモラス';

interface StepState {
  completed: boolean;
  collapsed: boolean;
}

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const { generateText, isGeneratingText, generatedContent, setGeneratedContent } = useAI(user?.id ? String(user.id) : undefined);
  const { createPost, isCreating, createError } = usePosts();
  const { hashtags } = useHashtags();
  const { showToast } = useToast();

  // Content State (STEP 1)
  const [postPurpose, setPostPurpose] = useState<PostPurpose>('認知向上');
  const [postTone, setPostTone] = useState<PostTone>('プロフェッショナル');
  const [keywords, setKeywords] = useState('');
  const [caption, setCaption] = useState('');

  // Visual State (STEP 2)
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'carousel'>('image');

  // Settings State (STEP 3)
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [hashtagSet, setHashtagSet] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [postTiming, setPostTiming] = useState<'now' | 'scheduled'>('now');

  // Preview State (STEP 4)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Step Management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [steps, setSteps] = useState<Record<number, StepState>>({
    1: { completed: false, collapsed: false },
    2: { completed: false, collapsed: true },
    3: { completed: false, collapsed: true },
    4: { completed: false, collapsed: true }
  });

  // Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Helper functions for step management
  const toggleStep = (stepNumber: number) => {
    setSteps(prev => ({
      ...prev,
      [stepNumber]: {
        ...prev[stepNumber],
        collapsed: !prev[stepNumber].collapsed
      }
    }));
  };

  const completeStep = (stepNumber: number) => {
    setSteps(prev => ({
      ...prev,
      [stepNumber]: { completed: true, collapsed: true },
      [stepNumber + 1]: stepNumber < 4 ? { ...prev[stepNumber + 1], collapsed: false } : prev[stepNumber + 1]
    }));
    
    if (stepNumber < 4) {
      setCurrentStep((stepNumber + 1) as 1 | 2 | 3 | 4);
    }
  };

  const isStepValid = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: return caption.trim().length > 0;
      case 2: return true; // メディアはオプション
      case 3: return true; // 設定はオプション
      case 4: return true; // プレビューは常に有効
      default: return false;
    }
  };

  // AI Caption Generation
  const handleGenerateCaption = async () => {
    const prompt = `
投稿目的: ${postPurpose}
トーン: ${postTone}
キーワード: ${keywords}
${selectedHashtags.length > 0 ? `\nハッシュタグ: ${selectedHashtags.map(tag => `#${tag}`).join(' ')}` : ''}

上記の条件に基づいて、Instagram投稿用のキャプションを日本語で生成してください。
文字数は2200文字以内で、読みやすく魅力的な内容にしてください。
`;

    try {
      await generateText({ 
        prompt, 
        options: { 
          tone: postTone === 'ユーモラス' ? '面白い' : postTone, 
          length: '中程度（3-4文）' 
        } 
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'AI生成エラー',
        message: 'キャプション生成に失敗しました'
      });
    }
  };

  // Emoji Suggest
  const suggestEmojis = () => {
    const emojiMap: Record<PostPurpose, string[]> = {
      '認知向上': ['✨', '💫', '🌟', '🚀', '💯', '👑', '🔥', '💎'],
      '商品紹介': ['🛍️', '💝', '🎁', '⭐', '💯', '🔥', '✨', '👌'],
      'エンゲージメント': ['❤️', '💕', '🥰', '😍', '👏', '🙌', '🤗', '💖'],
      '告知': ['📢', '🔔', '🎉', '🚀', '💫', '✨', '⚡', '🌟'],
      '日常投稿': ['☀️', '🌈', '💕', '😊', '🌺', '🍃', '🌸', '💫']
    };
    
    return emojiMap[postPurpose] || ['✨', '💫', '🌟'];
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // ファイルサイズチェック
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'ファイルサイズエラー',
          message: `${file.name}: 10MB以下にしてください`
        });
        return;
      }

      // ファイルタイプチェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        showToast({
          type: 'error',
          title: 'ファイルタイプエラー',
          message: `${file.name}: 対応していない形式です`
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaFiles(prev => [...prev, event.target.result as string]);
          setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
          if (mediaFiles.length === 0) {
            completeStep(2);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length > 0) {
      showToast({
        type: 'success',
        title: 'アップロード完了',
        message: `${files.length}個のファイルをアップロードしました`
      });
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const autoSave = setInterval(() => {
      const draftData = {
        postPurpose,
        postTone,
        keywords,
        caption,
        mediaFiles,
        selectedHashtags,
        scheduledAt,
        postTiming
      };

      // Save to localStorage
      localStorage.setItem('createPost_draft', JSON.stringify(draftData));
      setLastSaved(new Date());
    }, 30000); // 30秒ごとに自動保存

    return () => clearInterval(autoSave);
  }, [postPurpose, postTone, keywords, caption, mediaFiles, selectedHashtags, scheduledAt, postTiming, autoSaveEnabled]);

  // AI生成結果をキャプションに設定
  useEffect(() => {
    if (generatedContent) {
      setCaption(generatedContent);
      setGeneratedContent(null);
      // STEP 1完了をチェック
      if (generatedContent.trim().length > 0) {
        completeStep(1);
      }
    }
  }, [generatedContent, setGeneratedContent]);

  const handlePublishPost = async (isDraft: boolean = false) => {
    if (!caption.trim()) {
      showToast({
        type: 'warning',
        title: '入力エラー',
        message: 'キャプションを入力してください'
      });
      return;
    }

    const finalCaption = selectedHashtags.length > 0 
      ? `${caption.trim()}\n\n${selectedHashtags.map(tag => `#${tag}`).join(' ')}`
      : caption.trim();
    
    const postData = {
      caption: finalCaption,
      image_url: mediaFiles[0] || null,
      scheduled_at: postTiming === 'scheduled' ? scheduledAt : null,
      status: isDraft ? 'draft' as const : postTiming === 'scheduled' ? 'scheduled' as const : 'published' as const,
    };

    try {
      createPost(postData);
      
      showToast({
        type: 'success',
        title: isDraft ? '下書き保存完了' : postTiming === 'scheduled' ? '投稿予約完了' : '投稿公開完了',
        message: isDraft ? '下書きとして保存されました' : postTiming === 'scheduled' ? '指定時刻に投稿されます' : '投稿が公開されました'
      });

      // Reset form after successful post
      setCaption('');
      setMediaFiles([]);
      setSelectedHashtags([]);
      setScheduledAt('');
      setKeywords('');
      
      // Reset steps
      setSteps({
        1: { completed: false, collapsed: false },
        2: { completed: false, collapsed: true },
        3: { completed: false, collapsed: true },
        4: { completed: false, collapsed: true }
      });
      setCurrentStep(1);
      
    } catch (error) {
      showToast({
        type: 'error',
        title: '投稿失敗',
        message: error instanceof Error ? error.message : '投稿の作成に失敗しました'
      });
    }
  };

  const sampleImages = [
    'https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'https://images.pexels.com/photos/1526814/pexels-photo-1526814.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            投稿作成スタジオ
          </h1>
          {lastSaved && (
            <div className="flex items-center text-sm text-gray-500">
              <Save className="w-4 h-4 mr-1" />
              最後に保存: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
        <p className="text-gray-600">AIを活用したInstagram投稿作成ワークフロー</p>
      </div>

      {/* STEP 1: Content Creation */}
      <div className={`bg-white rounded-xl shadow-lg border transition-all ${currentStep === 1 ? 'ring-2 ring-blue-500' : ''}`}>
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleStep(1)}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              steps[1].completed ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {steps[1].completed ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">コンテンツ作成</h2>
              <p className="text-sm text-gray-600">投稿の目的とキャプションを設定</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-gray-400" title="投稿の目的とトーンを選択して、AIでキャプションを生成できます" />
            {steps[1].collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
        
        {!steps[1].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Post Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    投稿の目的
                  </label>
                  <select
                    value={postPurpose}
                    onChange={(e) => setPostPurpose(e.target.value as PostPurpose)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="認知向上">ブランド認知向上</option>
                    <option value="商品紹介">商品・サービス紹介</option>
                    <option value="エンゲージメント">エンゲージメント向上</option>
                    <option value="告知">告知・お知らせ</option>
                    <option value="日常投稿">日常投稿</option>
                  </select>
                </div>

                {/* Post Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    トーン
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['カジュアル', 'フォーマル', '親しみやすい', 'プロフェッショナル', 'ユーモラス'] as PostTone[]).map((tone) => (
                      <label key={tone} className="flex items-center">
                        <input
                          type="radio"
                          name="tone"
                          value={tone}
                          checked={postTone === tone}
                          onChange={(e) => setPostTone(e.target.value as PostTone)}
                          className="mr-2"
                        />
                        <span className="text-sm">{tone}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    キーワード
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="含めたいキーワードをスペース区切りで入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* AI Generation */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-purple-900">AIキャプション生成</h3>
                  </div>
                  <button
                    onClick={handleGenerateCaption}
                    disabled={isGeneratingText}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isGeneratingText ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        AIでキャプション生成
                      </>
                    )}
                  </button>
                </div>

                {/* Emoji Suggest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    絵文字サジェスト
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestEmojis().map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => setCaption(prev => prev + emoji)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-md text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Caption Input */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                キャプション
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="キャプションを入力してください..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={2200}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {caption.length}/2200 文字
                </span>
                <button
                  onClick={() => isStepValid(1) && completeStep(1)}
                  disabled={!isStepValid(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  次のステップへ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Visual Settings */}
      <div className={`bg-white rounded-xl shadow-lg border transition-all ${currentStep === 2 ? 'ring-2 ring-blue-500' : ''}`}>
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleStep(2)}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              steps[2].completed ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {steps[2].completed ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ビジュアル設定</h2>
              <p className="text-sm text-gray-600">画像・動画のアップロードと選択</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-gray-400" title="画像や動画をアップロードまたは選択してください" />
            {steps[2].collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
        
        {!steps[2].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="mt-6 space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/50">
                {mediaFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {mediaFiles.map((url, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={url} 
                            alt={`アップロード ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-600">メディアをアップロード</p>
                      <p className="text-sm text-gray-500">JPG、PNG、MP4（最大10MB）</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <input
                    type="file"
                    id="media-upload"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="media-upload"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    ファイルを選択
                  </label>
                </div>
              </div>

              {/* Sample Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  クイック選択
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMediaFiles(prev => [...prev, url]);
                        if (mediaFiles.length === 0) completeStep(2);
                      }}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img src={url} alt={`Sample ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => completeStep(2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  次のステップへ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: Post Settings */}
      <div className={`bg-white rounded-xl shadow-lg border transition-all ${currentStep === 3 ? 'ring-2 ring-blue-500' : ''}`}>
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleStep(3)}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              steps[3].completed ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {steps[3].completed ? <Check className="w-5 h-5" /> : '3'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">投稿設定</h2>
              <p className="text-sm text-gray-600">ハッシュタグと投稿日時を設定</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-gray-400" title="ハッシュタグの選択と投稿タイミングを設定してください" />
            {steps[3].collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
        
        {!steps[3].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="mt-6 space-y-6">
              {/* Hashtag Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Hash className="w-4 h-4 inline mr-1" />
                  ハッシュタグ
                </label>
                <HashtagManager
                  showSelection={true}
                  selectedHashtags={selectedHashtags}
                  onSelectHashtags={setSelectedHashtags}
                />
              </div>

              {/* Post Timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  投稿タイミング
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timing"
                        value="now"
                        checked={postTiming === 'now'}
                        onChange={(e) => setPostTiming(e.target.value as 'now' | 'scheduled')}
                        className="mr-2"
                      />
                      <span>今すぐ投稿</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timing"
                        value="scheduled"
                        checked={postTiming === 'scheduled'}
                        onChange={(e) => setPostTiming(e.target.value as 'now' | 'scheduled')}
                        className="mr-2"
                      />
                      <span>予約投稿</span>
                    </label>
                  </div>
                  
                  {postTiming === 'scheduled' && (
                    <div>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => completeStep(3)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  次のステップへ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 4: Preview & Post */}
      <div className={`bg-white rounded-xl shadow-lg border transition-all ${currentStep === 4 ? 'ring-2 ring-blue-500' : ''}`}>
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleStep(4)}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              steps[4].completed ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {steps[4].completed ? <Check className="w-5 h-5" /> : '4'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">プレビュー&投稿</h2>
              <p className="text-sm text-gray-600">最終確認と投稿実行</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-gray-400" title="プレビューを確認して投稿してください" />
            {steps[4].collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
        
        {!steps[4].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="mt-6 space-y-6">
              {/* Device Toggle */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">プレビューモード:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                      previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>モバイル</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                      previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>デスクトップ</span>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className={`bg-black rounded-lg p-4 ${previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-md'} mx-auto`}>
                <div className="bg-white rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center p-3 border-b">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    <div className="ml-3">
                      <p className="text-sm font-semibold">your_username</p>
                    </div>
                  </div>
                  
                  {/* Media */}
                  {mediaFiles.length > 0 && (
                    <div className="aspect-square bg-gray-100">
                      <img 
                        src={mediaFiles[0]} 
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
                    {selectedHashtags.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedHashtags.map(tag => `#${tag}`).join(' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handlePublishPost(true)}
                  disabled={isCreating}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  下書き保存
                </button>
                <button
                  onClick={() => handlePublishPost(false)}
                  disabled={isCreating || !caption.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 inline mr-2" />
                      {postTiming === 'scheduled' ? '投稿予約' : '今すぐ投稿'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;