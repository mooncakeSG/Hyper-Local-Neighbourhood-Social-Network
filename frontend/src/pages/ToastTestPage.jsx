import { useState } from 'react'
import { showSuccess, showError, showWarning, showInfo, showLoading, updateToast } from '../utils/toast'

export default function ToastTestPage() {
  const [loadingToastId, setLoadingToastId] = useState(null)

  const handleSuccess = () => {
    showSuccess(
      'Success notification',
      'Subtitle and associated information pertaining to the event. Information to not exceed [x] characters.',
      [
        { label: 'Action', onClick: () => console.log('Action clicked') },
        { label: 'Action', onClick: () => console.log('Action 2 clicked') }
      ]
    )
  }

  const handleError = () => {
    showError(
      'Error notification',
      'Subtitle and associated information pertaining to the event. Information to not exceed [x] characters.',
      [
        { label: 'Retry', onClick: () => console.log('Retry clicked') },
        { label: 'Cancel', onClick: () => console.log('Cancel clicked') }
      ]
    )
  }

  const handleWarning = () => {
    showWarning(
      'Warning notification',
      'Subtitle and associated information pertaining to the event. Information to not exceed [x] characters.',
      [
        { label: 'Action', onClick: () => console.log('Action clicked') },
        { label: 'Action', onClick: () => console.log('Action 2 clicked') }
      ]
    )
  }

  const handleInfo = () => {
    showInfo(
      'Informational notification',
      'Subtitle and associated information pertaining to the event. Information to not exceed [x] characters.',
      [
        { label: 'Action', onClick: () => console.log('Action clicked') },
        { label: 'Action', onClick: () => console.log('Action 2 clicked') }
      ]
    )
  }

  const handleLoading = () => {
    const toastId = showLoading('Processing your request...')
    setLoadingToastId(toastId)
    
    // Simulate async operation
    setTimeout(() => {
      updateToast(toastId, 'success', 'Operation complete', 'Your request has been processed successfully')
      setLoadingToastId(null)
    }, 3000)
  }

  const handleLoadingError = () => {
    const toastId = showLoading('Uploading file...')
    setLoadingToastId(toastId)
    
    // Simulate failed async operation
    setTimeout(() => {
      updateToast(toastId, 'error', 'Upload failed', 'The file could not be uploaded. Please try again.')
      setLoadingToastId(null)
    }, 3000)
  }

  const handleSimpleSuccess = () => {
    showSuccess('Post created', 'Your post has been shared with your neighbourhood')
  }

  const handleSimpleError = () => {
    showError('Failed to create post', 'Please check your connection and try again')
  }

  const handleSimpleWarning = () => {
    showWarning('Invalid price', 'Please enter a valid price greater than or equal to 0')
  }

  const handleSimpleInfo = () => {
    showInfo('Password reset email sent', 'Please check your inbox for the reset link')
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-2">Toast Notification Test Page</h1>
        <p className="text-gray-600 mb-8">Click the buttons below to test different toast notification types</p>

        <div className="space-y-6">
          {/* Full Featured Toasts (matching design reference) */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-black mb-4">Full Featured Toasts</h2>
            <p className="text-sm text-gray-600 mb-4">These match your design reference with title, subtitle, and action buttons</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handleSuccess}
                className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Success Toast
              </button>
              <button
                onClick={handleError}
                className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Error Toast
              </button>
              <button
                onClick={handleWarning}
                className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Warning Toast
              </button>
              <button
                onClick={handleInfo}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Info Toast
              </button>
            </div>
          </section>

          {/* Simple Toasts (common use cases) */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-black mb-4">Simple Toasts</h2>
            <p className="text-sm text-gray-600 mb-4">Common use cases with just title and subtitle</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handleSimpleSuccess}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Simple Success
              </button>
              <button
                onClick={handleSimpleError}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Simple Error
              </button>
              <button
                onClick={handleSimpleWarning}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Simple Warning
              </button>
              <button
                onClick={handleSimpleInfo}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Simple Info
              </button>
            </div>
          </section>

          {/* Loading Toasts */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-black mb-4">Loading Toasts</h2>
            <p className="text-sm text-gray-600 mb-4">Test loading states that update to success or error</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleLoading}
                disabled={loadingToastId !== null}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingToastId ? 'Loading...' : 'Loading → Success'}
              </button>
              <button
                onClick={handleLoadingError}
                disabled={loadingToastId !== null}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingToastId ? 'Loading...' : 'Loading → Error'}
              </button>
            </div>
          </section>

          {/* Quick Test All */}
          <section>
            <h2 className="text-xl font-semibold text-black mb-4">Quick Test All</h2>
            <p className="text-sm text-gray-600 mb-4">Show all toast types in sequence</p>
            <button
              onClick={() => {
                showSuccess('Test 1', 'Success notification')
                setTimeout(() => showError('Test 2', 'Error notification'), 500)
                setTimeout(() => showWarning('Test 3', 'Warning notification'), 1000)
                setTimeout(() => showInfo('Test 4', 'Info notification'), 1500)
              }}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Show All Types
            </button>
          </section>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-black mb-2">Testing Instructions</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Click any button to trigger a toast notification</li>
            <li>Toasts appear in the top-right corner</li>
            <li>Click the X button to dismiss individual toasts</li>
            <li>Action buttons in toasts will log to console</li>
            <li>Loading toasts will automatically update after 3 seconds</li>
            <li>Toasts auto-dismiss after their duration (4-5 seconds)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

