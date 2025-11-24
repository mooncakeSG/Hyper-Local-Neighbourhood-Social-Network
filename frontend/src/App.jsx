import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/useUserStore'
import AuthPage from './pages/AuthPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NeighbourhoodSelectPage from './pages/NeighbourhoodSelectPage'
import FeedPage from './pages/FeedPage'
import Layout from './components/Layout'

function App() {
  const { user, neighbourhood } = useUserStore()

  return (
    <div className="min-h-screen bg-white">
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    {!user && <Route path="*" element={<Navigate to="/auth" replace />} />}
        {user && !neighbourhood && (
          <Route path="/select-neighbourhood" element={<NeighbourhoodSelectPage />} />
        )}
        {user && !neighbourhood && (
          <Route path="*" element={<Navigate to="/select-neighbourhood" replace />} />
        )}
        {user && neighbourhood && (
          <Route path="/" element={<Layout />}>
            <Route index element={<FeedPage />} />
          </Route>
        )}
      </Routes>
    </div>
  )
}

export default App
