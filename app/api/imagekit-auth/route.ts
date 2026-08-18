import { NextRequest, NextResponse } from 'next/server'
import { getUploadAuthParams } from '@imagekit/next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7))
    if (decodedToken.admin !== true) {
      return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })
    }

    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'ImageKit is not configured.' }, { status: 503 })
    }

    return NextResponse.json({
      ...getUploadAuthParams({ publicKey, privateKey }),
      publicKey,
    })
  } catch (error) {
    console.error('Unable to authorize ImageKit upload:', error)
    return NextResponse.json({ error: 'Unable to authorize upload.' }, { status: 401 })
  }
}
