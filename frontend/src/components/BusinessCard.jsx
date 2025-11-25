import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import BusinessDetails from './BusinessDetails'

export default function BusinessCard({ business, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false)
  const { user } = useUserStore()

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-black rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex">
          {business.image_url ? (
            <img
              src={business.image_url}
              alt={business.name}
              className="w-32 h-32 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          )}

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-black text-lg">{business.name}</h3>
                <span className="text-xs text-gray-500 capitalize ml-2">
                  {business.category}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {business.description || 'No description'}
              </p>

              {business.phone && (
                <div className="text-sm text-gray-600 mb-1">
                  📞 {business.phone}
                </div>
              )}

              {business.address && (
                <div className="text-sm text-gray-600">
                  📍 {business.address}
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <span>{formatTime(business.created_at)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <BusinessDetails
            businessId={business.id}
            onClose={() => setShowDetails(false)}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </>
  )
}

