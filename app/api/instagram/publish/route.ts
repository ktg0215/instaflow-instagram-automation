import { NextResponse } from 'next/server'
import { InstagramService } from '@/services/instagramService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mediaUrl: string | undefined = body?.mediaUrl
    const caption: string | undefined = body?.caption
    const mediaType: 'image' | 'video' | undefined = body?.mediaType

    if (!mediaUrl || !caption || !mediaType) {
      return NextResponse.json(
        { error: 'mediaUrl, caption, mediaType は必須です' },
        { status: 400 }
      )
    }

    let instagramPostId: string

    if (mediaType === 'video') {
      instagramPostId = await InstagramService.createVideoPost({
        video_url: mediaUrl,
        caption,
        access_token: ''
      })
    } else {
      instagramPostId = await InstagramService.createImagePost({
        image_url: mediaUrl,
        caption,
        access_token: ''
      })
    }

    return NextResponse.json({ success: true, instagramPostId }, { status: 200 })
  } catch (error: any) {
    const message = error?.message || 'Instagram への公開に失敗しました'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}


