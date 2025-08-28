import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { useToast } from '@/context/ToastContext';
import { 
  Upload, Image, Save, Send, RefreshCw, Sparkles, 
  Check, ChevronDown, ChevronRight, Smartphone, Monitor, X
} from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Lazy load heavy components for better performance
const HashtagManager = lazy(() => import('@/components/HashtagManager'));
const EmojiPicker = lazy(() => import('./EmojiPicker'));

type PostPurpose = '認知向上' | '商品紹介' | 'エンゲージメント' | '告知' | '日常投稿';
type PostTone = 'カジュアル' | 'フォーマル' | '親しみやすい' | 'プロフェッショナル' | 'ユーモラス';

interface StepState {
  completed: boolean;
  collapsed: boolean;
}

// Memoized components for better performance
const StepHeader = React.memo(({ 
  stepNum, 
  title, 
  description, 
  completed, 
  collapsed, 
  isActive, 
  onClick 
}: {
  stepNum: number;
  title: string;
  description: string;
  completed: boolean;
  collapsed: boolean;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div 
    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center space-x-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        completed ? 'bg-green-500 text-white' : 
        isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
      }`}>
        {completed ? <Check className="w-5 h-5" /> : stepNum}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
  </div>
));

const MediaPreview = React.memo(({ 
  files, 
  onRemove 
}: { 
  files: string[]; 
  onRemove: (index: number) => void;
}) => (
  <div className="grid grid-cols-3 gap-4">
    {files.map((url, index) => (
      <div key={`${url}-${index}`} className="relative">
        <img 
          src={url} 
          alt={`アップロード ${index + 1}`}
          className="w-full h-32 object-cover rounded-lg"
          loading="lazy"
        />
        <button
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          aria-label="画像を削除"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
));

const CreatePostOptimized: React.FC = () => {
  const { user } = useAuth();
  const { generateText, isGeneratingText, generatedContent, setGeneratedContent } = useAI(user?.id ? String(user.id) : undefined);
  const { createPost, isCreating } = usePosts();
  const { showToast } = useToast();

  // Content State (STEP 1)
  const [postPurpose, setPostPurpose] = useState<PostPurpose>('認知向上');
  const [postTone, setPostTone] = useState<PostTone>('プロフェッショナル');
  const [keywords, setKeywords] = useState('');
  const [caption, setCaption] = useState('');

  // Visual State (STEP 2)
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);

  // Settings State (STEP 3)
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
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

  // Memoized values for performance
  const emojiSuggestions = useMemo(() => {
    const emojiMap: Record<PostPurpose, string[]> = {
      '認知向上': ['✨', '💫', '🌟', '🚀', '💯', '👑', '🔥', '💎'],
      '商品紹介': ['🛍️', '💝', '🎁', '⭐', '💯', '🔥', '✨', '👌'],
      'エンゲージメント': ['❤️', '💕', '🥰', '😍', '👏', '🙌', '🤗', '💖'],
      '告知': ['📢', '🔔', '🎉', '🚀', '💫', '✨', '⚡', '🌟'],
      '日常投稿': ['☀️', '🌈', '💕', '😊', '🌺', '🍃', '🌸', '💫']
    };
    return emojiMap[postPurpose] || ['✨', '💫', '🌟'];
  }, [postPurpose]);

  const isStepValid = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: return caption.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }, [caption]);

  // Memoized callbacks for performance
  const toggleStep = useCallback((stepNumber: number) => {
    setSteps(prev => ({
      ...prev,
      [stepNumber]: {
        ...prev[stepNumber],
        collapsed: !prev[stepNumber].collapsed
      }
    }));
  }, []);

  const completeStep = useCallback((stepNumber: number) => {
    setSteps(prev => ({
      ...prev,
      [stepNumber]: { completed: true, collapsed: true },
      [stepNumber + 1]: stepNumber < 4 ? { ...prev[stepNumber + 1], collapsed: false } : prev[stepNumber + 1]
    }));
    
    if (stepNumber < 4) {
      setCurrentStep((stepNumber + 1) as 1 | 2 | 3 | 4);
    }
  }, []);

  // Optimized file upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // File size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'ファイルサイズエラー',
          message: `${file.name}: 10MB以下にしてください`
        });
        return;
      }

      // File type check
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
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
  }, [mediaFiles.length, showToast, completeStep]);

  // Optimized AI generation
  const handleGenerateCaption = useCallback(async () => {
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
  }, [postPurpose, postTone, keywords, selectedHashtags, generateText, showToast]);

  // Remove media file callback
  const removeMediaFile = useCallback((index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-save functionality (throttled)
  useEffect(() => {
    const autoSave = setTimeout(() => {
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

      localStorage.setItem('createPost_draft', JSON.stringify(draftData));
      setLastSaved(new Date());
    }, 2000); // Debounced auto-save

    return () => clearTimeout(autoSave);
  }, [postPurpose, postTone, keywords, caption, mediaFiles, selectedHashtags, scheduledAt, postTiming]);

  // AI生成結果をキャプションに設定
  useEffect(() => {
    if (generatedContent) {
      setCaption(generatedContent);
      setGeneratedContent(null);
      if (generatedContent.trim().length > 0) {
        completeStep(1);
      }
    }
  }, [generatedContent, setGeneratedContent, completeStep]);

  const handlePublishPost = useCallback(async (isDraft: boolean = false) => {
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

      // Reset form
      setCaption('');
      setMediaFiles([]);
      setSelectedHashtags([]);
      setScheduledAt('');
      setKeywords('');
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
  }, [caption, selectedHashtags, mediaFiles, postTiming, scheduledAt, createPost, showToast]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              投稿作成スタジオ
            </h1>
            <p className="text-gray-600 mt-1">AIを活用したInstagram投稿作成ワークフロー</p>
          </div>
          {lastSaved && (
            <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <Save className="w-4 h-4 mr-2" />
              <span>最後に保存: {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: 1, title: 'コンテンツ作成', desc: '目的とキャプション' },
            { num: 2, title: 'ビジュアル設定', desc: '画像・動画選択' },
            { num: 3, title: '投稿設定', desc: 'ハッシュタグ・日時' },
            { num: 4, title: 'プレビュー&投稿', desc: '最終確認' }
          ].map((step) => (
            <button
              key={step.num}
              onClick={() => {
                setCurrentStep(step.num as 1 | 2 | 3 | 4);
                toggleStep(step.num);
              }}
              className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                currentStep === step.num
                  ? 'border-blue-500 bg-blue-50'
                  : steps[step.num].completed
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-sm font-medium ${
                steps[step.num].completed ? 'bg-green-500 text-white' : 
                currentStep === step.num ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {steps[step.num].completed ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <div className="text-left">
                <div className={`font-medium ${
                  currentStep === step.num ? 'text-blue-700' :
                  steps[step.num].completed ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">{step.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Content Creation */}
      <div className={`bg-white rounded-xl shadow-lg border transition-all ${currentStep === 1 ? 'ring-2 ring-blue-500' : ''}`}>
        <StepHeader
          stepNum={1}
          title="コンテンツ作成"
          description="投稿の目的とキャプションを設定"
          completed={steps[1].completed}
          collapsed={steps[1].collapsed}
          isActive={currentStep === 1}
          onClick={() => toggleStep(1)}
        />
        
        {!steps[1].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Post Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <Sparkles className="w-5 h-5 text-purple-600" />
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
                    {emojiSuggestions.map((emoji, index) => (
                      <button
                        key={`${emoji}-${index}`}
                        onClick={() => setCaption(prev => prev + emoji)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-md text-lg transition-colors"
                        type="button"
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
                  type="button"
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
        <StepHeader
          stepNum={2}
          title="ビジュアル設定"
          description="画像・動画のアップロードと選択"
          completed={steps[2].completed}
          collapsed={steps[2].collapsed}
          isActive={currentStep === 2}
          onClick={() => toggleStep(2)}
        />
        
        {!steps[2].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="mt-6 space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/50">
                {mediaFiles.length > 0 ? (
                  <div className="space-y-4">
                    <MediaPreview files={mediaFiles} onRemove={removeMediaFile} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-600">メディアをアップロード</p>
                      <p className="text-sm text-gray-500">JPG、PNG、WebP（最大10MB）</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <input
                    type="file"
                    id="media-upload"
                    accept="image/*"
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

              <div className="flex justify-end">
                <button
                  onClick={() => completeStep(2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
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
        <StepHeader
          stepNum={3}
          title="投稿設定"
          description="ハッシュタグと投稿日時を設定"
          completed={steps[3].completed}
          collapsed={steps[3].collapsed}
          isActive={currentStep === 3}
          onClick={() => toggleStep(3)}
        />
        
        {!steps[3].collapsed && (
          <div className="px-6 pb-6 border-t bg-gray-50/50">
            <div className="mt-6 space-y-6">
              {/* Hashtag Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ハッシュタグ
                </label>
                <Suspense fallback={<LoadingSkeleton />}>
                  <HashtagManager
                    showSelection={true}
                    selectedHashtags={selectedHashtags}
                    onSelectHashtags={setSelectedHashtags}
                  />
                </Suspense>
              </div>

              {/* Post Timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  type="button"
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
        <StepHeader
          stepNum={4}
          title="プレビュー&投稿"
          description="最終確認と投稿実行"
          completed={steps[4].completed}
          collapsed={steps[4].collapsed}
          isActive={currentStep === 4}
          onClick={() => toggleStep(4)}
        />
        
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
                    type="button"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>モバイル</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                      previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                    type="button"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>デスクトップ</span>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className={`bg-black rounded-lg p-2 sm:p-4 ${previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-md'} mx-auto`}>
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
                        loading="lazy"
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
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => handlePublishPost(true)}
                  disabled={isCreating}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  type="button"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  下書き保存
                </button>
                <button
                  onClick={() => handlePublishPost(false)}
                  disabled={isCreating || !caption.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
                  type="button"
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

export default CreatePostOptimized;