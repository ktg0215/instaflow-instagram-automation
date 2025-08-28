import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import sharp from 'sharp'

// Supported formats and their configurations
const SUPPORTED_FORMATS = {
  webp: { quality: 85, effort: 4 },
  avif: { quality: 80, effort: 4 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 8, progressive: true }
} as const

type SupportedFormat = keyof typeof SUPPORTED_FORMATS

// Instagram optimal dimensions
const INSTAGRAM_SIZES = {
  square: { width: 1080, height: 1080 },      // 1:1 ratio
  portrait: { width: 1080, height: 1350 },    // 4:5 ratio  
  landscape: { width: 1080, height: 566 },    // 1.91:1 ratio
  story: { width: 1080, height: 1920 },       // 9:16 ratio
  thumbnail: { width: 320, height: 320 },     // Thumbnails
  preview: { width: 640, height: 640 }        // Preview images
} as const

type InstagramSize = keyof typeof INSTAGRAM_SIZES

interface OptimizationOptions {
  format?: SupportedFormat
  size?: InstagramSize
  quality?: number
  progressive?: boolean
  removeMetadata?: boolean
  watermark?: boolean
}

interface OptimizationResult {
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  format: string
  dimensions: { width: number; height: number }
  optimizedUrl: string
  metadata: {
    hasAlpha: boolean
    colorSpace: string
    processedAt: string
  }
}

// Rate limiting for image processing
const processingQueue = new Map<string, { count: number; lastReset: number }>()
const MAX_REQUESTS_PER_MINUTE = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = processingQueue.get(userId)
  
  if (!userRequests) {
    processingQueue.set(userId, { count: 1, lastReset: now })
    return true
  }
  
  if (now - userRequests.lastReset > 60000) {
    userRequests.count = 1
    userRequests.lastReset = now
    return true
  }
  
  if (userRequests.count < MAX_REQUESTS_PER_MINUTE) {
    userRequests.count++
    return true
  }
  
  return false
}

// Progressive image delivery
async function generateProgressiveVersions(
  buffer: Buffer,
  format: SupportedFormat,
  baseSize: { width: number; height: number }
): Promise<Array<{ size: string; buffer: Buffer; width: number; height: number }>> {
  const versions = []
  const sizes = [
    { name: 'small', multiplier: 0.5 },
    { name: 'medium', multiplier: 0.75 },
    { name: 'large', multiplier: 1 }
  ]
  
  for (const sizeConfig of sizes) {
    const width = Math.round(baseSize.width * sizeConfig.multiplier)
    const height = Math.round(baseSize.height * sizeConfig.multiplier)
    
    let processor = sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
    
    if (format === 'webp') {
      processor = processor.webp(SUPPORTED_FORMATS.webp)
    } else if (format === 'avif') {
      processor = processor.avif(SUPPORTED_FORMATS.avif)
    } else if (format === 'jpeg') {
      processor = processor.jpeg(SUPPORTED_FORMATS.jpeg)
    } else if (format === 'png') {
      processor = processor.png(SUPPORTED_FORMATS.png)
    }
    
    const processedBuffer = await processor.toBuffer()
    
    versions.push({
      size: sizeConfig.name,
      buffer: processedBuffer,
      width,
      height
    })
  }
  
  return versions
}

// Add watermark
async function addWatermark(buffer: Buffer, text: string = 'Created with InstaAI'): Promise<Buffer> {
  const image = sharp(buffer)
  const { width, height } = await image.metadata()
  
  if (!width || !height) {
    return buffer
  }
  
  // Create watermark SVG
  const watermarkSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <text
        x="${width - 20}"
        y="${height - 20}"
        font-family="Arial, sans-serif"
        font-size="14"
        text-anchor="end"
        fill="white"
        fill-opacity="0.7"
        filter="url(#shadow)"
      >${text}</text>
    </svg>
  `
  
  return await image
    .composite([{
      input: Buffer.from(watermarkSvg),
      gravity: 'southeast'
    }])
    .toBuffer()
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const userId = String(user.id)
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json({ 
        error: 'レート制限に達しました。1分後に再試行してください。' 
      }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const options: OptimizationOptions = {
      format: (formData.get('format') as SupportedFormat) || 'webp',
      size: (formData.get('size') as InstagramSize) || 'square',
      quality: parseInt(formData.get('quality') as string) || 85,
      progressive: formData.get('progressive') === 'true',
      removeMetadata: formData.get('removeMetadata') !== 'false',
      watermark: formData.get('watermark') === 'true'
    }
    
    if (!file) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'ファイルサイズが大きすぎます（最大10MB）' 
      }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'サポートされていないファイル形式です' 
      }, { status: 400 })
    }
    
    const originalBuffer = Buffer.from(await file.arrayBuffer())
    const originalSize = originalBuffer.length
    
    // Get target dimensions
    const targetSize = INSTAGRAM_SIZES[options.size]
    
    // Initialize sharp processor
    let processor = sharp(originalBuffer)
    
    // Get original metadata
    const metadata = await processor.metadata()
    
    // Remove metadata if requested
    if (options.removeMetadata) {
      processor = processor.withMetadata({
        exif: {},
        icc: metadata.icc,
        iptc: {}
      })
    }
    
    // Resize image
    processor = processor.resize(targetSize.width, targetSize.height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: false
    })
    
    // Apply format-specific optimizations
    const formatConfig = SUPPORTED_FORMATS[options.format]
    const quality = options.quality || formatConfig.quality || 85
    
    if (options.format === 'webp') {
      processor = processor.webp({
        quality,
        effort: formatConfig.effort,
        progressive: options.progressive
      })
    } else if (options.format === 'avif') {
      processor = processor.avif({
        quality,
        effort: formatConfig.effort
      })
    } else if (options.format === 'jpeg') {
      processor = processor.jpeg({
        quality,
        progressive: options.progressive || formatConfig.progressive,
        mozjpeg: true
      })
    } else if (options.format === 'png') {
      processor = processor.png({
        compressionLevel: formatConfig.compressionLevel,
        progressive: options.progressive || formatConfig.progressive
      })
    }
    
    // Process the image
    let optimizedBuffer = await processor.toBuffer()
    
    // Add watermark if requested
    if (options.watermark) {
      optimizedBuffer = await addWatermark(optimizedBuffer, `@${user.name || 'user'}`)
    }
    
    // Generate progressive versions for different screen sizes
    const progressiveVersions = await generateProgressiveVersions(
      optimizedBuffer,
      options.format,
      targetSize
    )
    
    const optimizedSize = optimizedBuffer.length
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100)
    
    // In a real implementation, you'd upload these to a CDN
    // For now, we'll return the optimized image as base64
    const optimizedBase64 = `data:image/${options.format};base64,${optimizedBuffer.toString('base64')}`
    
    // Progressive versions as base64
    const progressiveBase64 = progressiveVersions.map(version => ({
      size: version.size,
      url: `data:image/${options.format};base64,${version.buffer.toString('base64')}`,
      width: version.width,
      height: version.height,
      fileSize: version.buffer.length
    }))
    
    const result: OptimizationResult & { progressive?: any[] } = {
      originalSize,
      optimizedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      format: options.format,
      dimensions: targetSize,
      optimizedUrl: optimizedBase64,
      metadata: {
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'srgb',
        processedAt: new Date().toISOString()
      },
      progressive: progressiveBase64
    }
    
    return NextResponse.json({
      success: true,
      ...result,
      optimization: {
        originalFormat: file.type,
        targetFormat: options.format,
        qualityUsed: quality,
        sizeSaved: originalSize - optimizedSize,
        compressionRatio: `${Math.round(compressionRatio)}%`
      }
    }, {
      headers: {
        'X-Processing-Time': Date.now().toString(),
        'X-Compression-Ratio': `${compressionRatio.toFixed(1)}%`
      }
    })
    
  } catch (error: any) {
    console.error('Image Optimization Error:', error)
    return NextResponse.json({ 
      error: '画像の最適化に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}