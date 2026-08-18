'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Github,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    pendingProviderLink,
    linkPendingGithubWithGoogle,
    clearPendingProviderLink,
  } = useAuth()

  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [socialLoading, setSocialLoading] = useState<
    'google' | 'github' | null
  >(null)

  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [loading, router, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setLoginError('')

    try {
      await signInWithEmail(email, password)
      router.replace('/')
    } catch (error) {
      const code = (error as { code?: string }).code

      setLoginError(
        code === 'auth/operation-not-allowed'
          ? 'Email login is not enabled yet.'
          : 'Incorrect email or password.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoginError('')
    setSocialLoading('google')

    try {
      const signedIn = await signInWithGoogle()

      if (signedIn) {
        router.replace('/')
      }
    } catch (error) {
      console.error('Google login error:', error)

      const code = (error as { code?: string }).code

      if (
        code !== 'auth/popup-closed-by-user' &&
        code !== 'auth/cancelled-popup-request'
      ) {
        setLoginError(
          'Unable to sign in with Google. Please try again.',
        )
      }
    } finally {
      setSocialLoading(null)
    }
  }

  const handleGithubLogin = async () => {
    setLoginError('')
    setSocialLoading('github')

    try {
      const signedIn = await signInWithGithub()

      console.log('GitHub sign-in result:', signedIn)

      if (signedIn) {
        router.replace('/')
      }

      /*
       * If signedIn is false because the email already belongs
       * to another Firebase provider, AuthContext should set:
       *
       * pendingProviderLink = 'github'
       *
       * The linking UI below will then appear automatically.
       */
    } catch (error) {
      console.error('GitHub login error:', error)

      const code = (error as { code?: string }).code

      if (
        code !== 'auth/popup-closed-by-user' &&
        code !== 'auth/cancelled-popup-request'
      ) {
        setLoginError(
          code
            ? `Unable to sign in with GitHub. (${code})`
            : 'Unable to sign in with GitHub. Please try again.',
        )
      }
    } finally {
      setSocialLoading(null)
    }
  }

  const handleLinkGithubWithGoogle = async () => {
    setLoginError('')
    setSocialLoading('google')

    try {
      const linked = await linkPendingGithubWithGoogle()

      if (linked) {
        router.replace('/')
      }
    } catch (error) {
      console.error('GitHub account linking error:', error)

      const code = (error as { code?: string }).code

      if (code === 'auth/credential-already-in-use') {
        setLoginError(
          'This GitHub account is already connected to another Verde account.',
        )
      } else if (code === 'auth/provider-already-linked') {
        setLoginError(
          'GitHub is already connected to this account.',
        )
      } else if (
        code !== 'auth/popup-closed-by-user' &&
        code !== 'auth/cancelled-popup-request'
      ) {
        setLoginError(
          'Unable to connect your GitHub account. Please make sure you select the Google account that already owns this Verde account.',
        )
      }
    } finally {
      setSocialLoading(null)
    }
  }

  const socialLoginLoading = socialLoading !== null

  return (
    <main className="min-h-screen pt-36 pb-16 bg-gradient-to-br from-forest-50 to-white">
      <div className="container">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-forest-900 mb-2">
              Welcome Back
            </h1>

            <p className="text-gray-600">
              Sign in to your Verde account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />

                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                    className="w-4 h-4 text-forest-600 border-gray-300 rounded focus:ring-forest-500 cursor-pointer"
                  />

                  <span className="text-sm text-gray-700">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-forest-600 hover:text-forest-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* GitHub Account Linking Prompt */}
              {pendingProviderLink === 'github' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    GitHub account found
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-amber-700">
                    This email already belongs to an
                    existing Verde account. Sign in with
                    Google once to confirm the account and
                    connect GitHub.
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={
                        handleLinkGithubWithGoogle
                      }
                      disabled={socialLoginLoading}
                      className="flex-1 rounded-lg bg-forest-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {socialLoading === 'google'
                        ? 'Connecting...'
                        : 'Continue with Google'}
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearPendingProviderLink
                      }
                      disabled={socialLoginLoading}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {loginError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {loginError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  isLoading || socialLoginLoading
                }
                className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>

              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  OR
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={
                  socialLoginLoading || isLoading
                }
                className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
              >
                {socialLoading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}

                {socialLoading === 'google'
                  ? 'Signing in...'
                  : 'Continue with Google'}
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={
                  socialLoginLoading || isLoading
                }
                className="w-full bg-[#24292f] hover:bg-[#1b1f23] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
              >
                {socialLoading === 'github' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Github size={20} />
                )}

                {socialLoading === 'github'
                  ? 'Signing in...'
                  : 'Continue with GitHub'}
              </button>
            </div>

            {/* Sign Up */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-forest-600 hover:text-forest-700 font-semibold transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Guest */}
          <div className="mt-6 text-center">
            <Link
              href="/shop"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Continue as guest →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}