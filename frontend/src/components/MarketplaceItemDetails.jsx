import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import ImageUploader from './ImageUploader'

export default function MarketplaceItemDetails({ itemId, onClose, onUpdate }) {
  const { user, session } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ['marketplaceItem', itemId],
    queryFn: async () => {
      // DEV MODE: Return mock data
      const isDevMode = user?.id?.startsWith('dev-user-') || itemId?.startsWith('dev-item-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock marketplace item')
        return {
          id: itemId,
          title: 'Vintage Bicycle',
          description: 'Well-maintained bicycle, perfect for commuting',
          price: 500,
          category: 'electronics',
          condition: 'used',
          status: 'available',
          image_url: null,
          created_at: new Date().toISOString(),
          user: { id: 'dev-user-1', name: 'Dev User', email: 'dev@example.com' },
          user_id: 'dev-user-1',
        }
      }

      // PRODUCTION: Fetch from backend API
      const accessToken = session?.access_token
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/marketplace/${itemId}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch item details')
      }

      return response.json()
    },
    enabled: !!itemId,
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData) => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || itemId?.startsWith('dev-item-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Item would be updated:', updateData)
        return { ...item, ...updateData }
      }

      // PRODUCTION: Update via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/marketplace/${itemId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updateData)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update item')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marketplaceItem', itemId])
      queryClient.invalidateQueries(['marketplace'])
      setIsEditing(false)
      onUpdate()
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || itemId?.startsWith('dev-item-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Item would be deleted')
        return
      }

      // PRODUCTION: Delete via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/marketplace/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete item')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marketplace'])
      onClose()
      onUpdate()
    }
  })

  const handleMarkSold = async () => {
    await updateMutation.mutateAsync({ status: 'sold' })
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync()
    setShowDeleteConfirm(false)
  }

  const isOwner = item && user && item.user_id === user.id

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div className="bg-white rounded-lg p-6">
          <div className="text-black">Loading...</div>
        </div>
      </motion.div>
    )
  }

  if (!item) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-bold text-black flex-1 text-center">Item Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full rounded-lg mb-4"
          />
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-black mb-2">{item.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-black">
                R{parseFloat(item.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                item.condition === 'new' ? 'bg-green-100 text-green-800' :
                item.condition === 'like_new' ? 'bg-blue-100 text-blue-800' :
                item.condition === 'used' ? 'bg-yellow-100 text-yellow-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {item.condition === 'new' ? 'New' :
                 item.condition === 'like_new' ? 'Like New' :
                 item.condition === 'used' ? 'Used' : 'Fair'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                item.status === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {item.status === 'available' ? 'Available' : 'Sold'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-black whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="text-sm text-gray-600">
            <p>Category: <span className="capitalize">{item.category}</span></p>
            <p>Listed by: {item.user?.name || 'Anonymous'}</p>
            <p>Posted: {new Date(item.created_at).toLocaleDateString()}</p>
          </div>

          {isOwner && (
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              {item.status === 'available' && (
                <button
                  onClick={handleMarkSold}
                  disabled={updateMutation.isLoading}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  Mark as Sold
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2 border border-black rounded-lg text-black hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
            >
              <h3 className="text-lg font-bold text-black mb-2">Delete Item?</h3>
              <p className="text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 border border-black rounded-lg text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

