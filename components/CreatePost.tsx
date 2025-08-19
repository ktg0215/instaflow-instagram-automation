import React, { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { usePosts } from '../hooks/usePosts';
import { useHashtags } from '../hooks/useHashtags';
import { useToast } from '../context/ToastContext';
import { 
  Upload, Image, Video, Calendar, Hash, Send, MessageCircle, Bot, User, Settings, Clock, X, 
  Check, ChevronDown, ChevronRight, Smartphone, Monitor, Eye, Save, Zap, Sparkles, 
  HelpCircle, Target, Palette, Tag, Plus, RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type PostPurpose = '認知向上' | '商品紹介' | 'エンゲージメント' | '告知' | '日常投稿';
type PostTone = 'カジュアル' | 'フォーマル' | '親しみやすい' | 'プロフェッショナル' | 'ユーモラス';
type CompletedStep = 'content' | 'visual' | 'settings' | 'preview';

interface StepState {
  completed: boolean;
  collapsed: boolean;
}

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const { isConnected: instagramConnected, publishToInstagram } = useInstagram(user?.id ? String(user.id) : undefined);
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
      case 2: return mediaFiles.length > 0 || true; // メディアはオプション
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
  const suggestEmojis = async () => {
    const emojiMap: Record<PostPurpose, string[]> = {
      '認知向上': ['✨', '💫', '🌟', '🚀', '💯', '👑', '🔥', '💎'],
      '商品紹介': ['🛍️', '💝', '🎁', '⭐', '💯', '🔥', '✨', '👌'],
      'エンゲージメント': ['❤️', '💕', '🥰', '😍', '👏', '🙌', '🤗', '💖'],
      '告知': ['📢', '🔔', '🎉', '🚀', '💫', '✨', '⚡', '🌟'],
      '日常投稿': ['☀️', '🌈', '💕', '😊', '🌺', '🍃', '🌸', '💫']
    };
    
    return emojiMap[postPurpose] || ['✨', '💫', '🌟'];
  };

  // File Upload Handler (updated for multiple files)
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

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
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

  const handleChatSubmit = async (e: React.FormEvent | React.MouseEvent) => {
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
            <HelpCircle className="w-4 h-4 text-gray-400" />
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
                    {suggestEmojis().then ? null : suggestEmojis().map((emoji, index) => (
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
                onChange={handleCaptionChange}
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
          {/* タブコンテンツ */}
          {activeTab === 'create' && (
            <div>
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
                    <div className="p-4 border-t border-purple-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="AIに質問してください..."
                          className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={isGeneratingText}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleChatSubmit(e);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleChatSubmit}
                          disabled={!chatInput.trim() || isGeneratingText}
                          className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
                  type="button"
                  onClick={(e) => handleSubmit(e)}
                  disabled={isCreating || !caption.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '処理中...' : (scheduledAt ? '投稿を予約' : '下書き保存')}
                </button>
              </div>
            </div>
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