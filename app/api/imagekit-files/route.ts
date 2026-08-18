import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7))
    if (decodedToken.admin !== true) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })

    const { fileIds } = await request.json() as { fileIds?: string[] }
    const uniqueFileIds = Array.from(new Set((fileIds || []).filter((fileId) => typeof fileId === 'string' && fileId)))
    if (!uniqueFileIds.length) return NextResponse.json({ deleted: 0 })
    if (uniqueFileIds.length > 100) return NextResponse.json({ error: 'A maximum of 100 files can be deleted at once.' }, { status: 400 })

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    if (!privateKey) return NextResponse.json({ error: 'ImageKit is not configured.' }, { status: 503 })
    const response = await fetch('https://api.imagekit.io/v1/files/batch/deleteByFileIds', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileIds: uniqueFileIds }),
    })
    if (!response.ok) return NextResponse.json({ error: `ImageKit deletion failed: ${await response.text()}` }, { status: response.status })
    return NextResponse.json({ deleted: uniqueFileIds.length })
  } catch (error) {
    console.error('Unable to delete ImageKit files:', error)
    return NextResponse.json({ error: 'Unable to delete ImageKit files.' }, { status: 500 })
  }
}
