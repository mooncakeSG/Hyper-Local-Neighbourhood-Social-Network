import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { motion } from 'framer-motion'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { setupOneSignalForUser } from '../utils/notifications'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState('signin') // 'signin', 'signup', 'forgot'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaRef, setCaptchaRef] = useState(null)
  const { setUser, setSession } = useUserStore()
  const navigate = useNavigate()

  // Show configuration error if Supabase is not configured
  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-red-800 mb-4">
            Missing Supabase environment variables. Please create a <code className="bg-red-100 px-2 py-1 rounded">.env</code> file in the frontend directory with:
          </p>
          <pre className="bg-black text-white p-4 rounded text-sm overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key`}
          </pre>
        </div>
      </div>
    )
  }

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!captchaToken) {
      setError('Please complete the hCaptcha verification')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          captcha_token: captchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error?.message || 'Sign up failed')
      }

      // Store session
      setUser(data.user)
      setSession({ access_token: data.access_token, refresh_token: data.refresh_token })

      // Initialize OneSignal notifications (non-blocking)
      const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID
      if (onesignalAppId) {
        setupOneSignalForUser(onesignalAppId, data.access_token).catch((err) => {
          console.warn('OneSignal setup failed:', err)
          // Don't block navigation if OneSignal fails
        })
      }

      // Reset captcha
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)

      // Navigate to neighbourhood selection or feed
      navigate('/select-neighbourhood')
    } catch (err) {
      setError(err.message || 'Failed to sign up')
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!captchaToken) {
      setError('Please complete the hCaptcha verification')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          captcha_token: captchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error?.message || 'Sign in failed')
      }

      // Store session
      setUser(data.user)
      setSession({ access_token: data.access_token, refresh_token: data.refresh_token })

      // Initialize OneSignal notifications (non-blocking)
      const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID
      if (onesignalAppId) {
        setupOneSignalForUser(onesignalAppId, data.access_token).catch((err) => {
          console.warn('OneSignal setup failed:', err)
          // Don't block navigation if OneSignal fails
        })
      }

      // Reset captcha
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)

      // Navigate to neighbourhood selection or feed
      if (data.user.neighbourhood_id) {
        navigate('/app')
      } else {
        navigate('/select-neighbourhood')
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!captchaToken) {
      setError('Please complete the hCaptcha verification')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          captcha_token: captchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error?.message || 'Failed to send reset email')
      }

      alert(data.message || 'If an account with that email exists, a password reset link has been sent.')
      setStep('signin')
      setEmail('')
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Neighbourhood</h1>
          <p className="text-gray-600">Connect with your local community</p>
        </div>

        <div className="bg-white border border-black rounded-lg p-6">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setStep('signin')
                setError('')
                setCaptchaToken(null)
                if (captchaRef && typeof captchaRef.reset === 'function') captchaRef.reset()
              }}
              className={`flex-1 py-2 rounded-lg border ${
                step === 'signin'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setStep('signup')
                setError('')
                setCaptchaToken(null)
                if (captchaRef && typeof captchaRef.reset === 'function') captchaRef.reset()
              }}
              className={`flex-1 py-2 rounded-lg border ${
                step === 'signup'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black'
              }`}
            >
              Sign Up
            </button>
          </div>

          {step === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot')
                    setError('')
                    setCaptchaToken(null)
                    if (captchaRef && typeof captchaRef.reset === 'function') captchaRef.reset()
                  }}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex justify-center">
                <HCaptcha
                  sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                  onVerify={handleCaptchaVerify}
                  onExpire={handleCaptchaExpire}
                  ref={(ref) => setCaptchaRef(ref)}
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex justify-center">
                <HCaptcha
                  sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                  onVerify={handleCaptchaVerify}
                  onExpire={handleCaptchaExpire}
                  ref={(ref) => setCaptchaRef(ref)}
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
          )}

          {step === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div className="flex justify-center">
                <HCaptcha
                  sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                  onVerify={handleCaptchaVerify}
                  onExpire={handleCaptchaExpire}
                  ref={(ref) => setCaptchaRef(ref)}
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('signin')
                  setError('')
                  setCaptchaToken(null)
                  if (captchaRef && typeof captchaRef.reset === 'function') captchaRef.reset()
                }}
                className="w-full text-black py-2 text-sm"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
