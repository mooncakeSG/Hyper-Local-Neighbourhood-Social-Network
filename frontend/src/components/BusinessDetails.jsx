import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import ImageUploader from './ImageUploader'

export default function BusinessDetails({ businessId, onClose, onUpdate }) {
  const { user, session } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()

  // Form state for editing
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('restaurant')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [imageUrl, setImageUrl] = useState(null)

  // Fetch business details
  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      // DEV MODE: Return mock data
      const isDevMode = user?.id?.startsWith('dev-user-') || businessId?.startsWith('dev-business-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock business')
        return {
          id: businessId,
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
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/businesses/${businessId}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch business details')
      }

      return response.json()
    },
    enabled: !!businessId,
    onSuccess: (data) => {
      if (data) {
        setName(data.name || '')
        setDescription(data.description || '')
        setCategory(data.category || 'restaurant')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setWebsite(data.website || '')
        setAddress(data.address || '')
        setImageUrl(data.image_url || null)
      }
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData) => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || businessId?.startsWith('dev-business-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Business would be updated:', updateData)
        return { ...business, ...updateData }
      }

      // PRODUCTION: Update via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/businesses/${businessId}`,
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
        throw new Error(errorData.detail || 'Failed to update business')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['business', businessId])
      queryClient.invalidateQueries(['businesses'])
      setIsEditing(false)
      onUpdate()
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || businessId?.startsWith('dev-business-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Business would be deleted')
        return
      }

      // PRODUCTION: Delete via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/businesses/${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete business')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['businesses'])
      onClose()
      onUpdate()
    }
  })

  const handleSave = async () => {
    const updateData = {}
    if (name !== business?.name) updateData.name = name.trim()
    if (description !== business?.description) updateData.description = description.trim() || null
    if (category !== business?.category) updateData.category = category
    if (phone !== business?.phone) updateData.phone = phone.trim() || null
    if (email !== business?.email) updateData.email = email.trim() || null
    if (website !== business?.website) updateData.website = website.trim() || null
    if (address !== business?.address) updateData.address = address.trim() || null
    if (imageUrl !== business?.image_url) updateData.image_url = imageUrl || null

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false)
      return
    }

    await updateMutation.mutateAsync(updateData)
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync()
    setShowDeleteConfirm(false)
  }

  const handleCancel = () => {
    setName(business?.name || '')
    setDescription(business?.description || '')
    setCategory(business?.category || 'restaurant')
    setPhone(business?.phone || '')
    setEmail(business?.email || '')
    setWebsite(business?.website || '')
    setAddress(business?.address || '')
    setImageUrl(business?.image_url || null)
    setIsEditing(false)
  }

  const isOwner = business && user && business.user_id === user.id
  const categories = ['restaurant', 'retail', 'service', 'other']

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

  if (!business) {
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
          <h2 className="text-xl font-bold text-black flex-1 text-center">Business Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isEditing ? (
          <>
            {business.image_url && (
              <img
                src={business.image_url}
                alt={business.name}
                className="w-full rounded-lg mb-4"
              />
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-black mb-2">{business.name}</h3>
                <span className="text-sm text-gray-500 capitalize">{business.category}</span>
              </div>

              {business.description && (
                <div>
                  <p className="text-black whitespace-pre-wrap">{business.description}</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {business.phone && (
                  <div className="text-gray-600">
                    <span className="font-medium">Phone:</span> {business.phone}
                  </div>
                )}
                {business.email && (
                  <div className="text-gray-600">
                    <span className="font-medium">Email:</span> {business.email}
                  </div>
                )}
                {business.website && (
                  <div className="text-gray-600">
                    <span className="font-medium">Website:</span>{' '}
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black underline hover:no-underline"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
                {business.address && (
                  <div className="text-gray-600">
                    <span className="font-medium">Address:</span> {business.address}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                <p>Listed by: {business.user?.name || 'Anonymous'}</p>
                <p>Posted: {new Date(business.created_at).toLocaleDateString()}</p>
              </div>

              {isOwner && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
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
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Image
              </label>
              <ImageUploader
                initialImageUrl={imageUrl}
                onImageUploaded={(url) => setImageUrl(url)}
                onImageRemoved={() => setImageUrl(null)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 border border-black rounded-lg text-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isLoading || !name.trim()}
                className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {updateMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

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
              <h3 className="text-lg font-bold text-black mb-2">Delete Business?</h3>
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

