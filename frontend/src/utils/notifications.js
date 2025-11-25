// OneSignal Notifications Integration
// This utility handles OneSignal SDK initialization and player ID registration

let onesignalInitialized = false
let playerId = null

/**
 * Initialize OneSignal SDK
 * @param {string} appId - OneSignal App ID
 * @returns {Promise<string|null>} - Player ID if successful, null otherwise
 */
export async function initializeOneSignal(appId) {
  if (onesignalInitialized) {
    return playerId
  }

  // Check if OneSignal is available (browser environment)
  if (typeof window === 'undefined' || !window.OneSignal) {
    console.warn('OneSignal SDK not loaded. Install @onesignal/onesignal-sdk-web package.')
    return null
  }

  try {
    await window.OneSignal.init({
      appId: appId,
      notifyButton: {
        enable: false, // We'll use custom UI
      },
      allowLocalhostAsSecureOrigin: true, // For development
    })

    // Get player ID
    const userId = await window.OneSignal.getUserId()
    playerId = userId

    onesignalInitialized = true
    console.log('OneSignal initialized with player ID:', playerId)
    
    return playerId
  } catch (error) {
    console.error('Failed to initialize OneSignal:', error)
    return null
  }
}

/**
 * Register player ID with backend
 * @param {string} accessToken - JWT access token
 * @param {string} playerId - OneSignal player ID
 * @returns {Promise<boolean>} - Success status
 */
export async function registerPlayerId(accessToken, playerId) {
  if (!playerId || !accessToken) {
    console.warn('Missing player ID or access token')
    return false
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/notifications/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ player_id: playerId })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to register player ID')
    }

    console.log('Player ID registered successfully')
    return true
  } catch (error) {
    console.error('Error registering player ID:', error)
    return false
  }
}

/**
 * Request notification permission
 * @returns {Promise<boolean>} - Permission granted status
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return false
  }

  try {
    const permission = await window.OneSignal.getNotificationPermission()
    
    if (permission === 'granted') {
      return true
    }

    if (permission === 'default') {
      // Request permission
      await window.OneSignal.registerForPushNotifications()
      const newPermission = await window.OneSignal.getNotificationPermission()
      return newPermission === 'granted'
    }

    return false
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

/**
 * Get current player ID
 * @returns {Promise<string|null>} - Player ID if available
 */
export async function getPlayerId() {
  if (!onesignalInitialized || typeof window === 'undefined' || !window.OneSignal) {
    return null
  }

  try {
    const userId = await window.OneSignal.getUserId()
    return userId || null
  } catch (error) {
    console.error('Error getting player ID:', error)
    return null
  }
}

/**
 * Setup OneSignal for a user after login
 * @param {string} appId - OneSignal App ID
 * @param {string} accessToken - JWT access token
 * @returns {Promise<boolean>} - Success status
 */
export async function setupOneSignalForUser(appId, accessToken) {
  try {
    // Initialize OneSignal
    const playerId = await initializeOneSignal(appId)
    
    if (!playerId) {
      console.warn('OneSignal initialization failed or not available')
      return false
    }

    // Request permission
    const hasPermission = await requestNotificationPermission()
    
    if (!hasPermission) {
      console.warn('Notification permission not granted')
      // Still register player ID even without permission (for future use)
    }

    // Register player ID with backend
    const registered = await registerPlayerId(accessToken, playerId)
    
    return registered
  } catch (error) {
    console.error('Error setting up OneSignal:', error)
    return false
  }
}

