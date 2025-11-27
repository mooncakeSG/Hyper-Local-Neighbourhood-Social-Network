import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useUserStore } from './store/useUserStore'
import { setupAutoTokenRefresh } from './utils/tokenRefresh'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NeighbourhoodSelectPage from './pages/NeighbourhoodSelectPage'
import FeedPage from './pages/FeedPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import MarketplacePage from './pages/MarketplacePage'
import BusinessPage from './pages/BusinessPage'
import ToastTestPage from './pages/ToastTestPage'
import SkeletonTestPage from './pages/SkeletonTestPage'
import TokenRefreshTestPage from './pages/TokenRefreshTestPage'
import Layout from './components/Layout'

function App() {
  const { user, neighbourhood, session } = useUserStore()

  // Setup automatic token refresh
  useEffect(() => {
    if (session?.access_token) {
      const cleanup = setupAutoTokenRefresh(5 * 60 * 1000) // Check every 5 minutes
      return cleanup
    }
  }, [session?.access_token])

  return (
    <div className="min-h-screen bg-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'custom-toast',
          style: {
            background: '#1f2937', // gray-800
            color: '#fff',
            border: 'none',
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/test-toast" element={<ToastTestPage />} />
        <Route path="/test-skeletons" element={<SkeletonTestPage />} />
        <Route path="/test-token-refresh" element={<TokenRefreshTestPage />} />
        
        {/* Protected routes - redirect to auth if not logged in */}
        {!user && <Route path="/app/*" element={<Navigate to="/auth" replace />} />}
        {!user && <Route path="/select-neighbourhood" element={<Navigate to="/auth" replace />} />}
        {user && !neighbourhood && (
          <Route path="/select-neighbourhood" element={<NeighbourhoodSelectPage />} />
        )}
        {user && !neighbourhood && (
          <Route path="/app/*" element={<Navigate to="/select-neighbourhood" replace />} />
        )}
        {user && neighbourhood && (
          <Route path="/app" element={<Layout />}>
            <Route index element={<FeedPage />} />
            <Route path="post/:postId" element={<PostDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="user/:userId" element={<UserProfilePage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="businesses" element={<BusinessPage />} />
          </Route>
        )}
        {user && neighbourhood && (
          <Route path="/" element={<Navigate to="/app" replace />} />
        )}
      </Routes>
    </div>
  )
}

export default App
