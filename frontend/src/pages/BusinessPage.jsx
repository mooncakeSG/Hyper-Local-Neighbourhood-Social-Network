import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import BusinessCard from '../components/BusinessCard'
import BusinessComposer from '../components/BusinessComposer'

export default function BusinessPage() {
  const { neighbourhood, user, session } = useUserStore()
  const [showComposer, setShowComposer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data: businesses, isLoading, refetch } = useQuery({
    queryKey: ['businesses', neighbourhood?.id, searchQuery, selectedCategory],
    queryFn: async () => {
      if (!neighbourhood?.id) return []

      // DEV MODE: Return mock data
      const isDevMode = neighbourhood?.id?.startsWith('dev-neighbourhood-') || user?.id?.startsWith('dev-user-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock businesses')
        return [
          {
            id: 'dev-business-1',
            name: 'Local Coffee Shop',
            description: 'Best coffee in the neighbourhood',
            category: 'restaurant',
            phone: '+27123456789',
            email: 'coffee@example.com',
            website: 'https://coffeeshop.example.com',
            address: '123 Main Street',
            image_url: null,
            created_at: new Date().toISOString(),
            user: { id: 'dev-user-1', name: 'Dev User', email: 'dev@example.com' },
          },
          {
            id: 'dev-business-2',
            name: 'Corner Store',
            description: 'Convenience store with daily essentials',
            category: 'retail',
            phone: '+27987654321',
            email: 'store@example.com',
            address: '456 Oak Avenue',
            image_url: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user: { id: 'dev-user-2', name: 'Test User', email: 'test@example.com' },
          },
        ]
      }

      // PRODUCTION: Fetch businesses from backend API
      const accessToken = session?.access_token
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      let url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/businesses?neighbourhood_id=${neighbourhood.id}`

      // Add search query if provided
      if (searchQuery.trim()) {
        url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/businesses/search?q=${encodeURIComponent(searchQuery)}&neighbourhood_id=${neighbourhood.id}`
      }

      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }

      const data = await response.json()
      return Array.isArray(data) ? data : (data.data || [])
    },
    enabled: !!neighbourhood?.id,
  })

  const categories = ['all', 'restaurant', 'retail', 'service', 'other']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-black">Loading businesses...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-1">
            Business Directory
          </h1>
          <p className="text-gray-600 text-sm">Local businesses in your neighbourhood</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg border text-sm capitalize ${
                  selectedCategory === cat
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Businesses List */}
        <div className="space-y-4">
          {businesses && businesses.length > 0 ? (
            businesses.map((business) => (
              <BusinessCard key={business.id} business={business} onUpdate={refetch} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No businesses found. Be the first to add one!</p>
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <BusinessComposer
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false)
            refetch()
          }}
        />
      )}

      <button
        onClick={() => setShowComposer(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-10"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  )
}

