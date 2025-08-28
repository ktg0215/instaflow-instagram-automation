import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

// Lightweight preview API specifically for the InstagramPreview component
interface PreviewData {
  caption: string
  mediaUrl?: string
  hashtags: string[]
  username: string
  profileImage?: string
  estimatedEngagement: {
    likes: number
    comments: number
    reach: number
    impressions: number
  }
  optimization: {
    characterCount: number
    hashtagCount: number
    readabilityScore: number
    seoScore: number
    suggestions: string[]
  }
  scheduling: {
    optimalTimes: Array<{
      time: string
      score: number
      reason: string
    }>
    timezone: string
  }
}

// Analyze caption for readability and SEO
function analyzeCaptionQuality(caption: string, hashtags: string[]): {
  readabilityScore: number
  seoScore: number
  suggestions: string[]
} {
  const suggestions: string[] = []
  let readabilityScore = 50 // Base score
  let seoScore = 50 // Base score

  // Length analysis
  const charCount = caption.length
  if (charCount < 50) {
    suggestions.push('キャプションをより詳細にすると、エンゲージメントが向上します')
    readabilityScore -= 10
  } else if (charCount > 2000) {
    suggestions.push('キャプションが長すぎます。要点を絞ることをお勧めします')
    readabilityScore -= 5
  } else {
    readabilityScore += 10
  }

  // Hashtag analysis
  const hashtagCount = hashtags.length
  if (hashtagCount === 0) {
    suggestions.push('ハッシュタグを追加すると発見性が向上します')
    seoScore -= 20
  } else if (hashtagCount > 30) {
    suggestions.push('ハッシュタグは30個以下にすることをお勧めします')
    seoScore -= 10
  } else if (hashtagCount >= 10 && hashtagCount <= 20) {
    seoScore += 15
  }

  // Emoji analysis
  const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length
  if (emojiCount > 0 && emojiCount <= 5) {
    readabilityScore += 5
    suggestions.push('絵文字の使用でエンゲージメントが向上しています')
  } else if (emojiCount > 10) {
    suggestions.push('絵文字の使用を控えめにすると読みやすくなります')
    readabilityScore -= 5
  }

  // Question analysis
  const hasQuestion = caption.includes('?') || caption.includes('？')
  if (hasQuestion) {
    readabilityScore += 10
    suggestions.push('質問形式はエンゲージメントを促進します')
  }

  // Call-to-action analysis
  const hasCallToAction = /コメント|シェア|フォロー|いいね|タグ|教えて|どう思う/i.test(caption)
  if (hasCallToAction) {
    readabilityScore += 10
  } else {
    suggestions.push('行動を促すフレーズを追加すると効果的です')
  }

  // Line breaks analysis
  const lineBreaks = (caption.match(/\n/g) || []).length
  if (lineBreaks > 0 && lineBreaks <= 5) {
    readabilityScore += 5
  } else if (lineBreaks > 8) {
    suggestions.push('改行を減らすと読みやすくなります')
    readabilityScore -= 3
  }

  return {
    readabilityScore: Math.min(Math.max(readabilityScore, 0), 100),
    seoScore: Math.min(Math.max(seoScore, 0), 100),
    suggestions: suggestions.slice(0, 3) // Limit to top 3 suggestions
  }
}

// Estimate engagement based on content analysis
function estimateEngagement(
  caption: string, 
  hashtags: string[], 
  hasMedia: boolean,
  userProfile?: any
): PreviewData['estimatedEngagement'] {
  let baseEngagement = 100
  
  // Content factors
  const charCount = caption.length
  if (charCount > 100 && charCount < 500) baseEngagement *= 1.2
  if (hashtags.length >= 10) baseEngagement *= 1.3
  if (hasMedia) baseEngagement *= 2.5
  
  // Question/CTA bonus
  const hasQuestion = caption.includes('?') || caption.includes('？')
  const hasCallToAction = /コメント|シェア|フォロー|いいね|タグ|教えて|どう思う/i.test(caption)
  if (hasQuestion) baseEngagement *= 1.15
  if (hasCallToAction) baseEngagement *= 1.1
  
  // Random variance for realism
  const variance = 0.8 + Math.random() * 0.4 // 80% to 120%
  baseEngagement *= variance
  
  return {
    likes: Math.floor(baseEngagement * 3),
    comments: Math.floor(baseEngagement * 0.4),
    reach: Math.floor(baseEngagement * 8),
    impressions: Math.floor(baseEngagement * 15)
  }
}

// Generate optimal posting times
function generateOptimalTimes(): PreviewData['scheduling']['optimalTimes'] {
  const times = [
    { time: '09:00', score: 85, reason: '朝の通勤時間でアクティブユーザーが多い' },
    { time: '12:00', score: 78, reason: '昼休み時間でエンゲージメント率が高い' },
    { time: '15:00', score: 72, reason: '午後のブレイクタイムで閲覧が増える' },
    { time: '18:00', score: 90, reason: '帰宅時間でSNSチェックが活発' },
    { time: '20:00', score: 88, reason: '夜のリラックス時間で滞在時間が長い' },
    { time: '22:00', score: 75, reason: '就寝前のSNSタイムで拡散されやすい' }
  ]
  
  return times.sort((a, b) => b.score - a.score).slice(0, 3)
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const body = await request.json().catch(() => ({}))
    const { 
      caption = '', 
      mediaUrl, 
      hashtags = [], 
      includeOptimization = true,
      includeScheduling = true 
    } = body
    
    // Basic validation
    if (!caption && !mediaUrl) {
      return NextResponse.json({ 
        error: 'キャプションまたはメディアが必要です' 
      }, { status: 400 })
    }
    
    const username = user.name || 'user'
    
    // Analyze content quality
    const optimization = includeOptimization 
      ? {
          ...analyzeCaptionQuality(caption, hashtags),
          characterCount: caption.length + hashtags.join(' #').length,
          hashtagCount: hashtags.length
        }
      : {
          characterCount: caption.length + hashtags.join(' #').length,
          hashtagCount: hashtags.length,
          readabilityScore: 0,
          seoScore: 0,
          suggestions: []
        }
    
    // Estimate engagement
    const estimatedEngagement = estimateEngagement(
      caption, 
      hashtags, 
      !!mediaUrl, 
      user
    )
    
    // Generate optimal times
    const scheduling = includeScheduling 
      ? {
          optimalTimes: generateOptimalTimes(),
          timezone: 'Asia/Tokyo'
        }
      : {
          optimalTimes: [],
          timezone: 'Asia/Tokyo'
        }
    
    const previewData: PreviewData = {
      caption,
      mediaUrl,
      hashtags,
      username,
      profileImage: user.image || undefined,
      estimatedEngagement,
      optimization,
      scheduling
    }
    
    return NextResponse.json({
      success: true,
      preview: previewData,
      metadata: {
        analyzedAt: new Date().toISOString(),
        userId: user.id,
        contentType: mediaUrl ? 'media_post' : 'text_post'
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Preview-Version': '2.0'
      }
    })
    
  } catch (error: any) {
    console.error('Preview API Error:', error)
    return NextResponse.json({ 
      error: 'プレビューデータの生成に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}