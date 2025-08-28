'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import { useIntegratedApi } from '../hooks/useIntegratedApi';
import { useHashtags } from '../hooks/useHashtags';
import { useToast } from '../context/ToastContext';
import { useProgressiveEnhancement, AdaptiveAnimation, ProgressiveImage } from './ProgressiveEnhancement';
import RealTimeIntegration from './RealTimeIntegration';
import EnhancedErrorBoundary from './ErrorBoundary';
import HashtagManager from './HashtagManager';
import InstagramPreview from './InstagramPreview';
import { 
  ChevronLeft, ChevronRight, Check, Upload, Image, Bot, Calendar, Send, 
  Save, RefreshCw, Sparkles, Target, Palette, Hash, Clock, Eye, Zap,
  Plus, X, FileText, Camera, Settings, CheckCircle2
} from 'lucide-react';

type PostPurpose = '認知向上' | '商品紹介' | 'エンゲージメント' | '告知' | '日常投稿';
type PostTone = 'カジュアル' | 'フォーマル' | '親しみやすい' | 'プロフェッショナル' | 'ユーモラス';

interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

const PostCreationWizard: React.FC = () => {
  const { user } = useAuth();
  const { generateText, isGeneratingText, generatedContent, setGeneratedContent } = useAI(user?.id ? String(user.id) : undefined);
  const { useOptimisticPosts } = useIntegratedApi();
  const { createPost, isCreating } = useOptimisticPosts({
    optimistic: true,
    compress: true
  });
  const { hashtags } = useHashtags();
  const { showToast } = useToast();
  const { preferences, features, capabilities } = useProgressiveEnhancement();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<WizardStep[]>([
    { id: 1, title: 'コンテンツ作成', subtitle: 'キャプションとトーンを設定', icon: FileText, completed: false },
    { id: 2, title: 'ビジュアル設定', subtitle: '画像・動画をアップロード', icon: Camera, completed: false },
    { id: 3, title: '投稿設定', subtitle: 'ハッシュタグと投稿日時', icon: Settings, completed: false },
    { id: 4, title: 'プレビュー', subtitle: '最終確認と投稿', icon: Eye, completed: false }
  ]);

  // Content State (STEP 1)
  const [postPurpose, setPostPurpose] = useState<PostPurpose>('認知向上');
  const [postTone, setPostTone] = useState<PostTone>('プロフェッショナル');
  const [keywords, setKeywords] = useState('');
  const [caption, setCaption] = useState('');

  // Visual State (STEP 2)
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Settings State (STEP 3)
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [postTiming, setPostTiming] = useState<'now' | 'scheduled'>('now');

  // Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Validation rules for each step
  const isStepValid = (stepId: number): boolean => {
    switch (stepId) {
      case 1: return caption.trim().length > 0;
      case 2: return true; // Media is optional
      case 3: return true; // Settings are optional
      case 4: return caption.trim().length > 0;
      default: return false;
    }
  };

  // Complete step and advance
  const completeStep = (stepId: number) => {
    if (!isStepValid(stepId)) return;

    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));

    if (stepId < 4) {
      setCurrentStep(stepId + 1);
    }
  };

  // Navigation
  const goToStep = (stepId: number) => {
    if (stepId < currentStep || (stepId === currentStep + 1 && isStepValid(currentStep))) {
      setCurrentStep(stepId);
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      completeStep(currentStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

  // File Upload Handlers
  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'ファイルサイズエラー',
          message: `${file.name}: 10MB以下にしてください`
        });
        return;
      }

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
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileArray.length > 0) {
      showToast({
        type: 'success',
        title: 'アップロード完了',
        message: `${fileArray.length}個のファイルをアップロードしました`
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Auto-save functionality
  useEffect(() => {
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

      localStorage.setItem('createPost_draft', JSON.stringify(draftData));
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(autoSave);
  }, [postPurpose, postTone, keywords, caption, mediaFiles, selectedHashtags, scheduledAt, postTiming]);

  // Set AI generated content
  useEffect(() => {
    if (generatedContent) {
      setCaption(generatedContent);
      setGeneratedContent(null);
    }
  }, [generatedContent, setGeneratedContent]);

  // Publish post
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

      // Reset form
      setCaption('');
      setMediaFiles([]);
      setSelectedHashtags([]);
      setScheduledAt('');
      setKeywords('');
      setCurrentStep(1);
      setSteps(prev => prev.map(step => ({ ...step, completed: false })));
      
    } catch (error) {
      showToast({
        type: 'error',
        title: '投稿失敗',
        message: error instanceof Error ? error.message : '投稿の作成に失敗しました'
      });
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <RealTimeIntegration
      showStatusIndicator={capabilities.isDesktop}
      enableNotifications={preferences.notifications}
      enableOptimisticUpdates={preferences.optimisticUI}
      position="top-left"
    >
      <EnhancedErrorBoundary
        level="component"
        showDetails={process.env.NODE_ENV === 'development'}
        maxRetries={3}
      >
        <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Progress */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              投稿作成ウィザード
            </h1>
            <p className="text-gray-600 mt-1">ステップバイステップでプロフェッショナルな投稿を作成</p>
          </div>
          {lastSaved && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              <span>最後に保存: {lastSaved.toLocaleTimeString()}</span>
            </motion.div>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="grid grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = step.completed;
            const isClickable = step.id <= currentStep || (step.id === currentStep + 1 && isStepValid(currentStep));
            
            return (
              <motion.button
                key={step.id}
                onClick={() => isClickable && goToStep(step.id)}
                className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : isClickable
                    ? 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                }`}
                whileHover={isClickable ? { scale: 1.02 } : {}}
                whileTap={isClickable ? { scale: 0.98 } : {}}
                disabled={!isClickable}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white' : 
                  'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <div className={`font-medium ${
                    isActive ? 'text-blue-700' :
                    isCompleted ? 'text-green-700' : 
                    'text-gray-700'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.subtitle}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* STEP 1: Content Creation */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <div className="flex items-center mb-6">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">コンテンツ作成</h2>
                </div>

                <div className="space-y-6">
                  {/* Purpose and Tone Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Target className="w-4 h-4 inline mr-2" />
                        投稿の目的
                      </label>
                      <select
                        value={postPurpose}
                        onChange={(e) => setPostPurpose(e.target.value as PostPurpose)}
                        className="input"
                      >
                        <option value="認知向上">ブランド認知向上</option>
                        <option value="商品紹介">商品・サービス紹介</option>
                        <option value="エンゲージメント">エンゲージメント向上</option>
                        <option value="告知">告知・お知らせ</option>
                        <option value="日常投稿">日常投稿</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Palette className="w-4 h-4 inline mr-2" />
                        トーン
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['カジュアル', 'フォーマル', '親しみやすい', 'プロフェッショナル', 'ユーモラス'] as PostTone[]).map((tone) => (
                          <label key={tone} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="tone"
                              value={tone}
                              checked={postTone === tone}
                              onChange={(e) => setPostTone(e.target.value as PostTone)}
                              className="mr-2 text-blue-600"
                            />
                            <span className="text-sm">{tone}</span>
                          </label>
                        ))}
                      </div>
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
                      className="input"
                    />
                  </div>

                  {/* AI Generation */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <Bot className="w-5 h-5 text-purple-600" />
                      <h3 className="font-medium text-purple-900">AIキャプション生成</h3>
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <button
                      onClick={handleGenerateCaption}
                      disabled={isGeneratingText}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isGeneratingText ? (
                        <>
                          <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 inline mr-2" />
                          AIでキャプション生成
                        </>
                      )}
                    </button>
                  </motion.div>

                  {/* Caption Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      キャプション
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="キャプションを入力してください..."
                      className="input h-32 resize-none"
                      maxLength={2200}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {caption.length}/2200 文字
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Visual Settings */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <div className="flex items-center mb-6">
                  <Camera className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">ビジュアル設定</h2>
                </div>

                <div className="space-y-6">
                  {/* Drag & Drop Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    {mediaFiles.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          {mediaFiles.map((url, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group"
                            >
                              <ProgressiveImage
                                src={url}
                                alt={`アップロード ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                                quality={preferences.reducedData ? 'low' : 'auto'}
                                loading="lazy"
                              />
                              <button
                                onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <motion.div 
                        animate={{ y: isDragOver ? -5 : 0 }}
                        className="space-y-4"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-600 font-medium">
                            {isDragOver ? 'ファイルをここにドロップ' : 'ファイルをドラッグ&ドロップまたはクリック'}
                          </p>
                          <p className="text-sm text-gray-500">JPG、PNG、MP4（最大10MB）</p>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="mt-4">
                      <input
                        type="file"
                        id="media-upload"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                      <label
                        htmlFor="media-upload"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        ファイルを選択
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Post Settings */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <div className="flex items-center mb-6">
                  <Settings className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">投稿設定</h2>
                </div>

                <div className="space-y-6">
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
                      <Clock className="w-4 h-4 inline mr-1" />
                      投稿タイミング
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-4">
                        {[
                          { value: 'now', label: '今すぐ投稿', icon: Send },
                          { value: 'scheduled', label: '予約投稿', icon: Calendar }
                        ].map(({ value, label, icon: Icon }) => (
                          <label key={value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                            <input
                              type="radio"
                              name="timing"
                              value={value}
                              checked={postTiming === value}
                              onChange={(e) => setPostTiming(e.target.value as 'now' | 'scheduled')}
                              className="text-blue-600"
                            />
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      
                      {postTiming === 'scheduled' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="input"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Preview */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-xl shadow-lg border p-6"
              >
                <div className="flex items-center mb-6">
                  <Eye className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">最終プレビュー</h2>
                </div>

                <div className="space-y-6">
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePublishPost(true)}
                      disabled={isCreating}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      下書き保存
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePublishPost(false)}
                      disabled={isCreating || !caption.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          処理中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {postTiming === 'scheduled' ? '投稿予約' : '今すぐ投稿'}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-6"
          >
            <InstagramPreview
              caption={caption}
              mediaUrl={mediaFiles[0]}
              hashtags={selectedHashtags}
              username="your_username"
            />
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border p-4"
      >
        <div className="flex justify-between items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            前のステップ
          </motion.button>

          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextStep}
            disabled={currentStep === 4 || !isStepValid(currentStep)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次のステップ
            <ChevronRight className="w-4 h-4 ml-2" />
          </motion.button>
        </div>
      </motion.div>
        </div>
      </EnhancedErrorBoundary>
    </RealTimeIntegration>
  );
};

export default PostCreationWizard;