/**
 * Enhanced API Client with automatic token refresh
 * Wraps fetch calls with token refresh logic
 */

import { getValidAccessToken } from './tokenRefresh'
import { useUserStore } from '../store/useUserStore'

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 * @returns {Promise<Response>} - Fetch response
 */
export async function authenticatedFetch(url, options = {}, requireAuth = true) {
  // Get valid access token (refreshes if needed)
  let accessToken = null
  if (requireAuth) {
    accessToken = await getValidAccessToken()
    if (!accessToken) {
      throw new Error('Authentication required. Please sign in again.')
    }
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add authorization header if we have a token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized - token might be invalid
  if (response.status === 401 && requireAuth) {
    // Try refreshing token once more
    const refreshedToken = await getValidAccessToken(true) // Silent refresh
    
    if (refreshedToken) {
      // Retry the request with new token
      headers['Authorization'] = `Bearer ${refreshedToken}`
      return fetch(url, {
        ...options,
        headers,
      })
    } else {
      // Refresh failed, clear session
      useUserStore.getState().clearUser()
      throw new Error('Session expired. Please sign in again.')
    }
  }

  return response
}

/**
 * Make a GET request with authentication
 */
export async function authenticatedGet(url, requireAuth = true) {
  const response = await authenticatedFetch(url, { method: 'GET' }, requireAuth)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Request failed with status ${response.status}`)
  }
  
  return response.json()
}

/**
 * Make a POST request with authentication
 */
export async function authenticatedPost(url, data, requireAuth = true) {
  const response = await authenticatedFetch(
    url,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    requireAuth
  )
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Request failed with status ${response.status}`)
  }
  
  return response.json()
}

/**
 * Make a PATCH request with authentication
 */
export async function authenticatedPatch(url, data, requireAuth = true) {
  const response = await authenticatedFetch(
    url,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    requireAuth
  )
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Request failed with status ${response.status}`)
  }
  
  return response.json()
}

/**
 * Make a DELETE request with authentication
 */
export async function authenticatedDelete(url, requireAuth = true) {
  const response = await authenticatedFetch(
    url,
    { method: 'DELETE' },
    requireAuth
  )
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Request failed with status ${response.status}`)
  }
  
  // DELETE might return 204 No Content
  if (response.status === 204) {
    return null
  }
  
  return response.json()
}

