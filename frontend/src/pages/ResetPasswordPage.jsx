import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import HCaptcha from '@hcaptcha/react-hcaptcha'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaRef, setCaptchaRef] = useState(null)
  const [hasValidToken, setHasValidToken] = useState(false)
  const navigate = useNavigate()

  // Check for Supabase auth tokens in URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    
    if (type === 'recovery' && accessToken) {
      // Valid password reset token
      setHasValidToken(true)
    } else {
      setError('Invalid or missing reset token. Please use the complete link from your email.')
    }
  }, [])

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (!captchaToken) {
      setError('Please complete the hCaptcha verification')
      setLoading(false)
      return
    }

    try {
      // Supabase handles password reset through the URL hash
      // Extract the access token and refresh token from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        // This is a password reset link from Supabase
        // Set the session with the token from URL
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          throw new Error('Invalid or expired reset token. Please request a new password reset link.')
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (updateError) {
          throw new Error(updateError.message)
        }

        setSuccess(true)
        setTimeout(() => {
          navigate('/auth')
        }, 3000)
      } else {
        // No valid reset token in URL
        throw new Error('Invalid or missing reset token. Please use the complete link from your email to reset your password.')
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password')
      if (captchaRef && typeof captchaRef.reset === 'function') {
        captchaRef.reset()
      }
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Password Reset Successful!</h2>
            <p className="text-green-800 mb-4">Your password has been reset. Redirecting to sign in...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <div className="bg-white border border-black rounded-lg p-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
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
              disabled={loading || !captchaToken || !hasValidToken}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full text-black py-2 text-sm"
            >
              Back to Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

