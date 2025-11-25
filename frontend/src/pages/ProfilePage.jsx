import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, session, neighbourhood } = useUserStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      // DEV MODE: Return mock data
      const isDevMode = user?.id?.startsWith('dev-user-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock user profile')
        return {
          id: user.id,
          name: user.name || 'Dev User',
          phone: '+27123456789',
          neighbourhood_id: neighbourhood?.id,
          onesignal_player_id: null,
        }
      }

      // PRODUCTION: Fetch from backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/me`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()
      return data
    },
    enabled: !!user && !!session,
    onSuccess: (data) => {
      setName(data.name || '')
      setPhone(data.phone || '')
    }
  })

  // Update user profile mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData) => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Profile would be updated:', updateData)
        return { ...userProfile, ...updateData }
      }

      // PRODUCTION: Update via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/me`,
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
        throw new Error(errorData.detail || 'Failed to update profile')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile', user?.id])
      setIsEditing(false)
      setError('')
    },
    onError: (err) => {
      setError(err.message || 'Failed to update profile')
    }
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const updateData = {}
    if (name !== userProfile?.name) {
      updateData.name = name.trim() || null
    }
    if (phone !== userProfile?.phone) {
      updateData.phone = phone.trim() || null
    }

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false)
      setLoading(false)
      return
    }

    try {
      await updateMutation.mutateAsync(updateData)
    } catch (err) {
      // Error handled by mutation
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(userProfile?.name || '')
    setPhone(userProfile?.phone || '')
    setIsEditing(false)
    setError('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-black">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-black mb-6">Profile</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-black rounded-lg p-6 space-y-6">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black">
                {userProfile?.name || 'Not set'}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27123456789"
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black">
                {userProfile?.phone || 'Not set'}
              </div>
            )}
          </div>

          {/* Neighbourhood */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Neighbourhood
            </label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black">
              {neighbourhood?.name || 'Not set'}
            </div>
            <button
              onClick={() => navigate('/select-neighbourhood')}
              className="mt-2 text-sm text-black underline hover:no-underline"
            >
              Change neighbourhood
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 border border-black rounded-lg text-black hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

