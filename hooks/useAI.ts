import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// NOTE: Supabase は未使用

interface TextGenerationOptions {
  tone?: string;
  length?: string;
}

interface ImageGenerationOptions {
  style?: string;
  aspectRatio?: string;
}

export const useAI = (userId: number | undefined) => {
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const generateTextMutation = useMutation({
    mutationFn: async ({ prompt, options }: { prompt: string; options?: TextGenerationOptions }) => {
      if (!userId) throw new Error('ユーザーが認証されていません');

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'text',
            prompt,
            options
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'AI生成に失敗しました');
        }

        setGeneratedContent(data.data.content);
        return data.data;
      } catch (error) {
        console.error('AI text generation error:', error);
        throw error;
      }
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: async ({ prompt, options }: { prompt: string; options?: ImageGenerationOptions }) => {
      if (!userId) throw new Error('ユーザーが認証されていません');

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'image',
            prompt,
            options
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'AI生成に失敗しました');
        }

        setGeneratedContent(data.data.content);
        return data.data;
      } catch (error) {
        console.error('AI image generation error:', error);
        throw error;
      }
    }
  });


  return {
    generatedContent,
    setGeneratedContent,
    generateText: generateTextMutation.mutate,
    generateImage: generateImageMutation.mutate,
    isGeneratingText: generateTextMutation.isPending,
    isGeneratingImage: generateImageMutation.isPending,
    textError: generateTextMutation.error,
    imageError: generateImageMutation.error,
  };
};