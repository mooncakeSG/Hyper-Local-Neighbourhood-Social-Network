/**
 * Token Refresh Utility
 * Handles automatic token refresh and expiration checking
 */

import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { showError, showWarning } from './toast'

/**
 * Decode JWT token to get expiration time
 * @param {string} token - JWT token
 * @returns {number|null} - Expiration timestamp in seconds, or null if invalid
 */
export function getTokenExpiration(token) {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))
    return payload.exp || null
  } catch (error) {
    console.warn('Failed to decode token:', error)
    return null
  }
}

/**
 * Check if token is expired or will expire soon
 * @param {string} token - JWT token
 * @param {number} bufferSeconds - Seconds before expiration to consider token "expiring soon" (default: 300 = 5 minutes)
 * @returns {boolean} - True if token is expired or expiring soon
 */
export function isTokenExpiredOrExpiringSoon(token, bufferSeconds = 300) {
  const exp = getTokenExpiration(token)
  if (!exp) return true // If we can't decode, assume expired

  const now = Math.floor(Date.now() / 1000)
  const expiresAt = exp
  const bufferTime = expiresAt - bufferSeconds

  return now >= bufferTime
}

/**
 * Check if token is already expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired
 */
export function isTokenExpired(token) {
  const exp = getTokenExpiration(token)
  if (!exp) return true

  const now = Math.floor(Date.now() / 1000)
  return now >= exp
}

/**
 * Refresh the session using Supabase
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{access_token: string, refresh_token: string}|null>} - New tokens or null if failed
 */
export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    console.warn('No refresh token available')
    return null
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      console.error('Token refresh error:', error)
      return null
    }

    if (data?.session) {
      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      }
    }

    return null
  } catch (error) {
    console.error('Token refresh exception:', error)
    return null
  }
}

/**
 * Refresh token if needed and update store
 * @param {boolean} silent - If true, don't show error toasts (default: false)
 * @returns {Promise<boolean>} - True if refresh was successful or not needed
 */
export async function refreshTokenIfNeeded(silent = false) {
  const { session } = useUserStore.getState()

  if (!session?.access_token) {
    return false
  }

  // Check if token needs refresh (expiring within 5 minutes)
  if (!isTokenExpiredOrExpiringSoon(session.access_token, 300)) {
    return true // Token is still valid
  }

  // Token needs refresh
  if (!session.refresh_token) {
    if (!silent) {
      showWarning(
        'Session expired',
        'Please sign in again to continue'
      )
    }
    return false
  }

  console.log('🔄 Refreshing token...')

  const newTokens = await refreshSession(session.refresh_token)

  if (!newTokens) {
    if (!silent) {
      showError(
        'Token refresh failed',
        'Please sign in again to continue'
      )
    }
    // Clear invalid session
    useUserStore.getState().clearUser()
    return false
  }

  // Update session in store
  useUserStore.getState().setSession({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
  })

  console.log('✅ Token refreshed successfully')
  return true
}

/**
 * Get valid access token, refreshing if needed
 * @param {boolean} silent - If true, don't show error toasts
 * @returns {Promise<string|null>} - Valid access token or null
 */
export async function getValidAccessToken(silent = false) {
  const { session } = useUserStore.getState()

  if (!session?.access_token) {
    return null
  }

  // Check if token is expired
  if (isTokenExpired(session.access_token)) {
    // Try to refresh
    const refreshed = await refreshTokenIfNeeded(silent)
    if (!refreshed) {
      return null
    }
    // Get new token from store
    return useUserStore.getState().session?.access_token || null
  }

  // Check if token is expiring soon and refresh proactively
  if (isTokenExpiredOrExpiringSoon(session.access_token, 300)) {
    await refreshTokenIfNeeded(true) // Silent refresh
    return useUserStore.getState().session?.access_token || null
  }

  return session.access_token
}

/**
 * Setup automatic token refresh interval
 * @param {number} checkInterval - Interval in milliseconds to check token (default: 5 minutes)
 * @returns {Function} - Cleanup function to stop the interval
 */
export function setupAutoTokenRefresh(checkInterval = 5 * 60 * 1000) {
  const intervalId = setInterval(async () => {
    const { session } = useUserStore.getState()
    
    // Only refresh if user is logged in
    if (session?.access_token) {
      await refreshTokenIfNeeded(true) // Silent refresh
    }
  }, checkInterval)

  // Return cleanup function
  return () => clearInterval(intervalId)
}

