import { toast } from 'sonner'

/**
 * Show success toast notification
 * @param {string} title - Main title of the notification
 * @param {string|null} subtitle - Optional subtitle/description
 * @param {Array|null} actions - Optional array of action buttons [{ label, onClick }]
 * @returns {string|number} Toast ID
 */
export const showSuccess = (title, subtitle = null, actions = null) => {
  return toast.success(title, {
    description: subtitle,
    duration: 4000,
    action: actions,
  })
}

/**
 * Show error toast notification
 * @param {string} title - Main title of the notification
 * @param {string|null} subtitle - Optional subtitle/description
 * @param {Array|null} actions - Optional array of action buttons [{ label, onClick }]
 * @returns {string|number} Toast ID
 */
export const showError = (title, subtitle = null, actions = null) => {
  return toast.error(title, {
    description: subtitle,
    duration: 5000,
    action: actions,
  })
}

/**
 * Show warning toast notification
 * @param {string} title - Main title of the notification
 * @param {string|null} subtitle - Optional subtitle/description
 * @param {Array|null} actions - Optional array of action buttons [{ label, onClick }]
 * @returns {string|number} Toast ID
 */
export const showWarning = (title, subtitle = null, actions = null) => {
  return toast.warning(title, {
    description: subtitle,
    duration: 4500,
    action: actions,
  })
}

/**
 * Show info toast notification
 * @param {string} title - Main title of the notification
 * @param {string|null} subtitle - Optional subtitle/description
 * @param {Array|null} actions - Optional array of action buttons [{ label, onClick }]
 * @returns {string|number} Toast ID
 */
export const showInfo = (title, subtitle = null, actions = null) => {
  return toast.info(title, {
    description: subtitle,
    duration: 4000,
    action: actions,
  })
}

/**
 * Show loading toast (for async operations)
 * @param {string} title - Loading message
 * @returns {string|number} Toast ID
 */
export const showLoading = (title) => {
  return toast.loading(title)
}

/**
 * Update loading toast to success/error
 * @param {string|number} toastId - ID of the toast to update
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} title - New title
 * @param {string|null} subtitle - Optional subtitle
 */
export const updateToast = (toastId, type, title, subtitle = null) => {
  toast[type](title, {
    id: toastId,
    description: subtitle,
  })
}

/**
 * Dismiss a specific toast
 * @param {string|number} toastId - ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId)
}

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss()
}

