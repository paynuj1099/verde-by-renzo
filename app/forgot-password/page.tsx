'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await resetPassword(email)
      setIsSubmitted(true)
    } catch (resetError) {
      const code = (resetError as { code?: string }).code
      setError(code === 'auth/operation-not-allowed'
        ? 'Email/password authentication is not enabled yet.'
        : 'Unable to send the reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-36 pb-16 bg-gradient-to-br from-forest-50 to-white">
      <div className="container">
        <div className="max-w-md mx-auto">
          {/* Back to Login */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 font-medium mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Login
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-forest-900 mb-2">
              {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
            </h1>
            <p className="text-gray-600">
              {isSubmitted 
                ? 'We\'ve sent you a password reset link' 
                : 'No worries, we\'ll send you reset instructions'}
            </p>
          </div>

          {/* Form or Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the email associated with your account
                  </p>
                </div>

                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to:
                </p>
                <p className="font-semibold text-forest-900 mb-6">
                  {email}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Click the link in the email to reset your password. 
                  If you don't see the email, check your spam folder.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-forest-600 hover:text-forest-700 font-medium transition-colors text-sm"
                >
                  Didn't receive the email? Resend
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <Link href="/contact-us" className="text-forest-600 hover:text-forest-700 font-medium transition-colors">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
