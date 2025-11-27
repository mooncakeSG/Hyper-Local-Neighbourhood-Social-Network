import { useState, useEffect, useRef } from 'react'
import { useUserStore } from '../store/useUserStore'
import {
  getTokenExpiration,
  isTokenExpired,
  isTokenExpiredOrExpiringSoon,
  refreshTokenIfNeeded,
  getValidAccessToken,
  setupAutoTokenRefresh,
} from '../utils/tokenRefresh'
import { showInfo, showSuccess, showError } from '../utils/toast'
import { authenticatedGet } from '../utils/apiClient'

export default function TokenRefreshTestPage() {
  const { session } = useUserStore()
  const [tokenInfo, setTokenInfo] = useState(null)
  const [autoRefreshStatus, setAutoRefreshStatus] = useState('Stopped')
  const [testResults, setTestResults] = useState([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const autoRefreshCleanupRef = useRef(null)

  useEffect(() => {
    updateTokenInfo()
    const interval = setInterval(updateTokenInfo, 1000) // Update every second
    
    // Setup auto-refresh for testing
    if (session?.access_token && autoRefreshStatus === 'Stopped') {
      const cleanup = setupAutoTokenRefresh(5 * 60 * 1000)
      autoRefreshCleanupRef.current = cleanup
      setAutoRefreshStatus('Active')
    }
    
    return () => {
      clearInterval(interval)
      if (autoRefreshCleanupRef.current) {
        autoRefreshCleanupRef.current()
      }
    }
  }, [session, autoRefreshStatus])

  const updateTokenInfo = () => {
    if (!session?.access_token) {
      setTokenInfo(null)
      return
    }

    const exp = getTokenExpiration(session.access_token)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = exp
    const timeUntilExpiry = expiresAt ? expiresAt - now : null
    const isExpired = isTokenExpired(session.access_token)
    const isExpiringSoon = isTokenExpiredOrExpiringSoon(session.access_token, 300)

    setTokenInfo({
      expiresAt: expiresAt ? new Date(expiresAt * 1000).toLocaleString() : 'Unknown',
      timeUntilExpiry: timeUntilExpiry,
      isExpired,
      isExpiringSoon,
      hasRefreshToken: !!session.refresh_token,
    })
  }

  const handleManualRefresh = async () => {
    try {
      const result = await refreshTokenIfNeeded(false)
      if (result) {
        showSuccess('Token refreshed', 'Your session has been refreshed successfully')
        updateTokenInfo()
      } else {
        showError('Refresh failed', 'Please sign in again')
      }
    } catch (error) {
      showError('Refresh error', error.message)
    }
  }

  const handleGetValidToken = async () => {
    try {
      const token = await getValidAccessToken()
      if (token) {
        showSuccess('Valid token obtained', `Token length: ${token.length} characters`)
        updateTokenInfo()
        addTestResult('Get Valid Token', 'Success', `Token obtained: ${token.substring(0, 20)}...`)
      } else {
        showError('No valid token', 'Please sign in again')
        addTestResult('Get Valid Token', 'Failed', 'No token available')
      }
    } catch (error) {
      showError('Error', error.message)
      addTestResult('Get Valid Token', 'Error', error.message)
    }
  }

  const handleTestAPI = async () => {
    try {
      addTestResult('API Test', 'Running', 'Testing authenticated API call...')
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/me`
      const data = await authenticatedGet(apiUrl)
      showSuccess('API Test Success', 'Authenticated API call worked!')
      addTestResult('API Test', 'Success', 'API call completed with auto-refresh')
      updateTokenInfo()
    } catch (error) {
      showError('API Test Failed', error.message)
      addTestResult('API Test', 'Failed', error.message)
    }
  }

  const handleRunAllTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    const tests = [
      {
        name: 'Token Expiration Check',
        test: async () => {
          if (!session?.access_token) return 'No token available'
          const exp = getTokenExpiration(session.access_token)
          return exp ? `Token expires at: ${new Date(exp * 1000).toLocaleString()}` : 'Could not decode token'
        }
      },
      {
        name: 'Token Expired Check',
        test: async () => {
          if (!session?.access_token) return 'No token available'
          const expired = isTokenExpired(session.access_token)
          return expired ? 'Token is expired' : 'Token is not expired'
        }
      },
      {
        name: 'Token Expiring Soon Check',
        test: async () => {
          if (!session?.access_token) return 'No token available'
          const expiringSoon = isTokenExpiredOrExpiringSoon(session.access_token, 300)
          return expiringSoon ? 'Token is expiring soon (within 5 min)' : 'Token is not expiring soon'
        }
      },
      {
        name: 'Get Valid Token',
        test: async () => {
          const token = await getValidAccessToken(true)
          return token ? `Valid token obtained (${token.length} chars)` : 'Failed to get valid token'
        }
      },
      {
        name: 'Refresh Token',
        test: async () => {
          const result = await refreshTokenIfNeeded(true)
          return result ? 'Token refresh successful' : 'Token refresh not needed or failed'
        }
      },
    ]

    for (const { name, test } of tests) {
      try {
        addTestResult(name, 'Running', 'Testing...')
        const result = await test()
        addTestResult(name, 'Success', result)
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
      } catch (error) {
        addTestResult(name, 'Error', error.message)
      }
    }

    setIsRunningTests(false)
    showInfo('Tests Complete', 'All token refresh tests have been run')
  }

  const addTestResult = (name, status, message) => {
    setTestResults(prev => [
      ...prev,
      {
        name,
        status,
        message,
        timestamp: new Date().toLocaleTimeString(),
      }
    ])
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return 'Expired'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  if (!session?.access_token) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-4">Token Refresh Test</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              Please sign in to test token refresh functionality.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-2">Token Refresh Test Page</h1>
        <p className="text-gray-600 mb-8">
          Monitor and test token refresh functionality
        </p>

        <div className="space-y-6">
          {/* Token Status */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Token Status</h2>
            {tokenInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-semibold ${
                      tokenInfo.isExpired
                        ? 'text-red-600'
                        : tokenInfo.isExpiringSoon
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {tokenInfo.isExpired
                      ? 'Expired'
                      : tokenInfo.isExpiringSoon
                      ? 'Expiring Soon'
                      : 'Valid'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expires At:</span>
                  <span className="text-black font-mono text-sm">{tokenInfo.expiresAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time Until Expiry:</span>
                  <span
                    className={`font-semibold ${
                      tokenInfo.timeUntilExpiry < 300 ? 'text-yellow-600' : 'text-black'
                    }`}
                  >
                    {formatTime(tokenInfo.timeUntilExpiry)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Has Refresh Token:</span>
                  <span className={tokenInfo.hasRefreshToken ? 'text-green-600' : 'text-red-600'}>
                    {tokenInfo.hasRefreshToken ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading token information...</p>
            )}
          </section>

          {/* Actions */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleManualRefresh}
                disabled={!session?.refresh_token}
                className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh Token Now
              </button>
              <button
                onClick={handleGetValidToken}
                disabled={!session?.access_token}
                className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Valid Token (Auto-refresh if needed)
              </button>
              <button
                onClick={handleTestAPI}
                disabled={!session?.access_token}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Authenticated API Call
              </button>
              <button
                onClick={handleRunAllTests}
                disabled={isRunningTests || !session?.access_token}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </button>
              <button
                onClick={updateTokenInfo}
                className="w-full px-4 py-3 border border-black text-black rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Update Token Info
              </button>
            </div>
          </section>

          {/* Test Results */}
          {testResults.length > 0 && (
            <section className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-black">Test Results</h2>
                <button
                  onClick={clearTestResults}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      result.status === 'Success'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'Failed' || result.status === 'Error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-black">{result.name}</span>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium ${
                          result.status === 'Success'
                            ? 'text-green-700'
                            : result.status === 'Failed' || result.status === 'Error'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{result.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Auto-Refresh Status */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Auto-Refresh Status</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                Auto-refresh is configured to check every 5 minutes and refresh tokens 5 minutes before expiration.
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="text-green-600 font-semibold">Active</span>
              </p>
            </div>
          </section>

          {/* Information */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-2">How It Works</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Tokens are automatically checked every 5 minutes</li>
              <li>Tokens refresh 5 minutes before expiration (proactive)</li>
              <li>API calls automatically refresh tokens if needed</li>
              <li>Failed refreshes show user-friendly error messages</li>
              <li>Expired sessions are cleared automatically</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

