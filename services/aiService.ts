import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');

export interface AIGenerationRequest {
  type: 'text' | 'image';
  prompt: string;
  options?: {
    tone?: string;
    length?: string;
    style?: string;
    aspectRatio?: string;
  };
}

export interface AIGenerationResult {
  content: string;
  tokensUsed?: number;
  cost?: number;
}

export class AIService {
  static async generateText(prompt: string, options?: {
    tone?: string;
    length?: string;
  }): Promise<AIGenerationResult> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = this.buildTextSystemPrompt(options);
      const fullPrompt = `${systemPrompt}\n\nユーザーからのリクエスト: ${prompt}`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text() || '';
      
      // Geminiは使用トークン数を直接提供しないため、概算
      const tokensUsed = Math.ceil(content.length / 4);
      
      return {
        content,
        tokensUsed,
        cost: this.calculateCost(tokensUsed, 'gemini-pro')
      };
    } catch (error) {
      console.error('AI text generation error:', error);
      throw new Error('テキスト生成に失敗しました');
    }
  }

  static async generateImage(prompt: string, options?: {
    style?: string;
    aspectRatio?: string;
  }): Promise<AIGenerationResult> {
    try {
      // Geminiは現在画像生成をサポートしていないため、テキストのみの実装
      throw new Error('Gemini Pro は画像生成をサポートしていません。テキスト生成のみ利用可能です。');
    } catch (error) {
      console.error('AI image generation error:', error);
      throw new Error('画像生成に失敗しました');
    }
  }

  private static buildTextSystemPrompt(options?: {
    tone?: string;
    length?: string;
  }): string {
    const tone = options?.tone || 'プロフェッショナル';
    const length = options?.length || '中程度（3-4文）';
    
    return `あなたはInstagram投稿のキャプション作成の専門家です。
以下の条件でキャプションを作成してください：

- トーン: ${tone}
- 長さ: ${length}
- 日本語で作成
- 適切なハッシュタグを3-5個含める
- エモジを効果的に使用
- エンゲージメントを促進する内容

魅力的で読みやすいキャプションを作成してください。`;
  }

  private static buildImagePrompt(prompt: string, options?: {
    style?: string;
  }): string {
    const style = options?.style || 'リアル';
    return `${prompt}, ${style}スタイル, 高品質, Instagram投稿用, 美しい構図`;
  }

  private static getImageSize(aspectRatio?: string): "1024x1024" | "1792x1024" | "1024x1792" {
    switch (aspectRatio) {
      case '16:9（横長）':
        return "1792x1024";
      case '9:16（ストーリー）':
      case '4:5（縦長）':
        return "1024x1792";
      default:
        return "1024x1024";
    }
  }

  private static calculateCost(tokens: number, model: string): number {
    if (model === 'gemini-pro') {
      // Gemini Pro の料金計算（2024年時点の概算）
      // Free tier: 15 requests per minute, 1500 requests per day
      const costPer1kTokens = 0.0005; // $0.0005 per 1K tokens (概算)
      return (tokens / 1000) * costPer1kTokens;
    }
    // 他のモデルのデフォルト料金
    const costPer1kTokens = 0.002;
    return (tokens / 1000) * costPer1kTokens;
  }
}