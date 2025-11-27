import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authenticatedFetch } from '../utils/apiClient'
import { useUserStore } from '../store/useUserStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function MentionAutocomplete({ 
  query, 
  onSelect, 
  position = { top: 0, left: 0 },
  visible = false 
}) {
  const { session, neighbourhood } = useUserStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['userSearch', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      
      // DEV MODE: Return mock users
      const isDevMode = neighbourhood?.id?.startsWith('dev-neighbourhood-')
      if (isDevMode) {
        return [
          { id: 'dev-user-1', name: 'John Doe', email: 'john@example.com' },
          { id: 'dev-user-2', name: 'Jane Smith', email: 'jane@example.com' },
          { id: 'dev-user-3', name: 'Bob Johnson', email: 'bob@example.com' },
        ].filter(u => 
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
        )
      }

      // PRODUCTION: Search via backend API
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/search?q=${encodeURIComponent(query)}&limit=5`,
        {},
        false
      )

      if (!response.ok) {
        return []
      }

      return response.json()
    },
    enabled: visible && query && query.length >= 2,
  })

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible || users.length === 0) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % users.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (users[selectedIndex]) {
          onSelect(users[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onSelect(null) // Close autocomplete
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, users, selectedIndex, onSelect])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && users.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, users.length])

  if (!visible || !query || query.length < 2 || users.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-50 bg-white border border-black rounded-lg shadow-lg max-h-48 overflow-y-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          minWidth: '200px',
        }}
        ref={listRef}
      >
        {isLoading ? (
          <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
        ) : (
          users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="font-medium text-black">{user.name || 'Anonymous'}</div>
              {user.email && (
                <div className="text-xs text-gray-500">{user.email}</div>
              )}
            </button>
          ))
        )}
      </motion.div>
    </AnimatePresence>
  )
}

