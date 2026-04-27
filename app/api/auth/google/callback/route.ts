import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }

  // Handle OAuth code
  if (code) {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || 'Failed to get access token')
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error('Failed to get user info')
      }

      // Here you would typically:
      // 1. Check if user exists in your database
      // 2. Create user if they don't exist
      // 3. Create a session/JWT token
      // 4. Set secure cookies
      
      console.log('Google user data:', userData)

      // For now, redirect to shop with success
      // You should set authentication cookies here
      const response = NextResponse.redirect(new URL('/shop?login=success', request.url))
      
      // Example: Set a simple session cookie (in production, use proper JWT/session management)
      response.cookies.set('user_email', userData.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    } catch (error) {
      console.error('Google OAuth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
