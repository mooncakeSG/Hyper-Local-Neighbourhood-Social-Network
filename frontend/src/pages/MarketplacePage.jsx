import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import MarketplaceItemCard from '../components/MarketplaceItemCard'
import MarketplaceItemComposer from '../components/MarketplaceItemComposer'
import MarketplaceItemSkeleton from '../components/skeletons/MarketplaceItemSkeleton'

export default function MarketplacePage() {
  const { neighbourhood, user, session } = useUserStore()
  const [showComposer, setShowComposer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' })

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['marketplace', neighbourhood?.id, searchQuery, selectedCategory],
    queryFn: async () => {
      if (!neighbourhood?.id) return []

      // DEV MODE: Return mock data
      const isDevMode = neighbourhood?.id?.startsWith('dev-neighbourhood-') || user?.id?.startsWith('dev-user-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock marketplace items')
        return [
          {
            id: 'dev-item-1',
            title: 'Vintage Bicycle',
            description: 'Well-maintained bicycle, perfect for commuting',
            price: 500,
            category: 'electronics',
            condition: 'used',
            status: 'available',
            image_url: null,
            created_at: new Date().toISOString(),
            user: { id: 'dev-user-1', name: 'Dev User', email: 'dev@example.com' },
          },
          {
            id: 'dev-item-2',
            title: 'Coffee Table',
            description: 'Modern wooden coffee table, excellent condition',
            price: 800,
            category: 'furniture',
            condition: 'like_new',
            status: 'available',
            image_url: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user: { id: 'dev-user-2', name: 'Test User', email: 'test@example.com' },
          },
        ]
      }

      // PRODUCTION: Fetch items from backend API
      const accessToken = session?.access_token
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      let url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/marketplace?neighbourhood_id=${neighbourhood.id}`

      // Add search query if provided
      if (searchQuery.trim()) {
        url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/marketplace/search?query=${encodeURIComponent(searchQuery)}&neighbourhood_id=${neighbourhood.id}`
      }

      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch marketplace items')
      }

      const data = await response.json()
      let items = Array.isArray(data) ? data : (data.data || [])

      // Client-side price filtering
      if (priceFilter.min || priceFilter.max) {
        items = items.filter(item => {
          const price = item.price || 0
          const min = priceFilter.min ? parseFloat(priceFilter.min) : 0
          const max = priceFilter.max ? parseFloat(priceFilter.max) : Infinity
          return price >= min && price <= max
        })
      }

      return items
    },
    enabled: !!neighbourhood?.id,
    refetchInterval: 60 * 1000, // Poll every 60 seconds for new marketplace items
    refetchIntervalInBackground: true,
  })

  const categories = ['all', 'electronics', 'furniture', 'clothing', 'other']

  if (isLoading) {
    return (
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <MarketplaceItemSkeleton />
            <MarketplaceItemSkeleton />
            <MarketplaceItemSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-1">
            Marketplace
          </h1>
          <p className="text-gray-600 text-sm">Buy and sell in your neighbourhood</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
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

          <div className="flex gap-2">
            <input
              type="number"
              value={priceFilter.min}
              onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
              placeholder="Min price (R)"
              className="flex-1 px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="number"
              value={priceFilter.max}
              onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
              placeholder="Max price (R)"
              className="flex-1 px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => (
              <MarketplaceItemCard key={item.id} item={item} onUpdate={refetch} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No items found. Be the first to list something!</p>
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <MarketplaceItemComposer
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

