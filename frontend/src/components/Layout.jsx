import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { supabase } from '../lib/supabaseClient'
import ChatbotWidget from './ChatbotWidget'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearUser } = useUserStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearUser()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-white">
      <Outlet />
      
      <ChatbotWidget />
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black">
        <div className="max-w-2xl mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center flex-1 ${
              location.pathname === '/' ? 'text-black' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Feed</span>
          </button>
          
          <button
            onClick={() => navigate('/marketplace')}
            className={`flex flex-col items-center justify-center flex-1 ${
              location.pathname === '/marketplace' ? 'text-black' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1">Market</span>
          </button>
          
          <button
            onClick={() => navigate('/businesses')}
            className={`flex flex-col items-center justify-center flex-1 ${
              location.pathname === '/businesses' ? 'text-black' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs mt-1">Business</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center flex-1 text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

