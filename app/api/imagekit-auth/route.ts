import { NextRequest, NextResponse } from 'next/server'
import { getUploadAuthParams } from '@imagekit/next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice(7))
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
    const message = error instanceof Error ? error.message : 'Unknown server error'
    const configurationError = message.includes('credential') || message.includes('default credentials') || message.includes('service account')
    return NextResponse.json(
      { error: configurationError ? 'Firebase Admin is not configured on the server.' : 'Unable to authorize upload.' },
      { status: configurationError ? 503 : 401 }
    )
  }
}
