/**
 * Pull-to-Refresh Utility
 * Handles pull-to-refresh gesture detection and callbacks
 */

/**
 * Setup pull-to-refresh functionality
 * @param {HTMLElement} element - Element to attach pull-to-refresh to
 * @param {Function} onRefresh - Callback when refresh is triggered
 * @param {Object} options - Configuration options
 * @returns {Function} - Cleanup function
 */
export function setupPullToRefresh(element, onRefresh, options = {}) {
  if (!element) return () => {}

  const {
    threshold = 80, // Distance in pixels to trigger refresh
    resistance = 2.5, // Resistance factor for overscroll
    disabled = false,
  } = options

  let startY = 0
  let currentY = 0
  let isPulling = false
  let pullDistance = 0
  let refreshIndicator = null

  // Create refresh indicator
  const createIndicator = () => {
    if (refreshIndicator) return refreshIndicator

    refreshIndicator = document.createElement('div')
    refreshIndicator.className = 'pull-to-refresh-indicator'
    refreshIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%) translateY(-100%);
      z-index: 1000;
      background: #1f2937;
      color: white;
      padding: 12px 24px;
      border-radius: 0 0 12px 12px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `
    refreshIndicator.innerHTML = `
      <svg class="refresh-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
      </svg>
      <span>Pull to refresh</span>
    `
    document.body.appendChild(refreshIndicator)
    return refreshIndicator
  }

  const updateIndicator = (distance, isRefreshing = false) => {
    const indicator = createIndicator()
    const progress = Math.min(distance / threshold, 1)
    const translateY = Math.min(distance * 0.5, threshold * 0.5) // Cap at threshold/2

    if (isRefreshing) {
      indicator.innerHTML = `
        <svg class="refresh-spinner spinning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
        </svg>
        <span>Refreshing...</span>
      `
      indicator.style.transform = `translateX(-50%) translateY(0)`
    } else if (distance > threshold) {
      indicator.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        <span>Release to refresh</span>
      `
      indicator.style.transform = `translateX(-50%) translateY(${translateY}px)`
    } else {
      indicator.innerHTML = `
        <svg class="refresh-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
        </svg>
        <span>Pull to refresh</span>
      `
      indicator.style.transform = `translateX(-50%) translateY(${translateY}px)`
    }
  }

  const hideIndicator = () => {
    if (refreshIndicator) {
      refreshIndicator.style.transform = 'translateX(-50%) translateY(-100%)'
      setTimeout(() => {
        if (refreshIndicator && refreshIndicator.parentNode) {
          refreshIndicator.parentNode.removeChild(refreshIndicator)
        }
        refreshIndicator = null
      }, 300)
    }
  }

  const handleTouchStart = (e) => {
    if (disabled || window.scrollY > 0) return

    startY = e.touches[0].clientY
    isPulling = true
  }

  const handleTouchMove = (e) => {
    if (!isPulling || disabled || window.scrollY > 0) return

    currentY = e.touches[0].clientY
    pullDistance = Math.max(0, (currentY - startY) / resistance)

    if (pullDistance > 0) {
      e.preventDefault()
      updateIndicator(pullDistance)
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return

    isPulling = false

    if (pullDistance >= threshold) {
      updateIndicator(pullDistance, true)
      try {
        await onRefresh()
      } finally {
        hideIndicator()
      }
    } else {
      hideIndicator()
    }

    pullDistance = 0
    startY = 0
    currentY = 0
  }

  // Add CSS for spinner animation
  if (!document.getElementById('pull-to-refresh-styles')) {
    const style = document.createElement('style')
    style.id = 'pull-to-refresh-styles'
    style.textContent = `
      .refresh-spinner.spinning {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd)

  // Cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    hideIndicator()
  }
}

