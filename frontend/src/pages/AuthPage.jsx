import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, hasSupabaseConfig, isDevMode } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { motion } from 'framer-motion'

export default function AuthPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser, setSession, setNeighbourhood, devMode, setDevMode } = useUserStore()
  const navigate = useNavigate()

  const handleDevMode = () => {
    // Create mock user for development
    const mockUser = {
      id: 'dev-user-' + Date.now(),
      phone: '+27123456789',
      name: 'Developer User',
    }
    const mockSession = {
      access_token: 'dev-token',
      user: mockUser,
    }
    const mockNeighbourhood = {
      id: 'dev-neighbourhood-1',
      name: 'Development Neighbourhood',
      city: 'Cape Town',
    }

    setUser(mockUser)
    setSession(mockSession)
    setNeighbourhood(mockNeighbourhood)
    setDevMode(true)
    navigate('/')
  }

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
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
          </pre>
          <p className="text-red-800 mt-4 text-sm">
            See <code className="bg-red-100 px-2 py-1 rounded">.env.example</code> for reference.
          </p>
        </div>
      </div>
    )
  }

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'sms',
        },
      })

      if (error) throw error
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms',
      })

      if (error) throw error

      setUser(data.user)
      setSession(data.session)
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

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
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
          </pre>
          <p className="text-red-800 mt-4 text-sm">
            See <code className="bg-red-100 px-2 py-1 rounded">.env.example</code> for reference.
          </p>
        </div>
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
          <h1 className="text-4xl font-bold text-black mb-2">Neighbourhood</h1>
          <p className="text-gray-600">Connect with your local community</p>
        </div>

        <div className="bg-white border border-black rounded-lg p-6">
          {/* Developer Mode Button */}
          {(isDevMode || import.meta.env.DEV) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2 font-medium">Developer Mode</p>
              <button
                type="button"
                onClick={handleDevMode}
                className="w-full bg-yellow-500 text-black py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Continue as Developer (Skip Auth)
              </button>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27 12 345 6789"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-black py-2 text-sm"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

