import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import MarketplaceItemDetails from './MarketplaceItemDetails'

export default function MarketplaceItemCard({ item, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false)
  const { user } = useUserStore()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

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

  const getConditionBadge = (condition) => {
    const badges = {
      new: { text: 'New', color: 'bg-green-500' },
      like_new: { text: 'Like New', color: 'bg-blue-500' },
      used: { text: 'Used', color: 'bg-yellow-500' },
      fair: { text: 'Fair', color: 'bg-orange-500' },
    }
    return badges[condition] || badges.used
  }

  const conditionBadge = getConditionBadge(item.condition)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-black rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-black text-lg">{item.title}</h3>
                <span className={`${conditionBadge.color} text-white text-xs px-2 py-1 rounded ml-2`}>
                  {conditionBadge.text}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="text-black font-bold text-lg">
                  {formatPrice(item.price)}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  item.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.status === 'available' ? 'Available' : 'Sold'}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{item.user?.name || 'Anonymous'}</span>
              <span>{formatTime(item.created_at)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <MarketplaceItemDetails
            itemId={item.id}
            onClose={() => setShowDetails(false)}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </>
  )
}

