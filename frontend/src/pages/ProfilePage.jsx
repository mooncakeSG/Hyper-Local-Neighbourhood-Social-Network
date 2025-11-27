import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ImageUploader'
import { authenticatedFetch } from '../utils/apiClient'
import { showSuccess, showError } from '../utils/toast'
import ProfileSkeleton from '../components/skeletons/ProfileSkeleton'

export default function ProfilePage() {
  const { user, session, neighbourhood } = useUserStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
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
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
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
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || null)
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
      queryClient.invalidateQueries(['userStats', user?.id])
      setIsEditing(false)
      setError('')
      showSuccess('Profile updated', 'Your profile has been updated successfully')
    },
    onError: (err) => {
      setError(err.message || 'Failed to update profile')
    }
  })

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      // DEV MODE: Return mock stats
      const isDevMode = user?.id?.startsWith('dev-user-')
      if (isDevMode) {
        return {
          posts_count: 5,
          comments_count: 12,
          marketplace_items_count: 2,
          businesses_count: 1
        }
      }

      // PRODUCTION: Fetch from backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/me/stats`,
        {},
        false
      )

      if (!response.ok) {
        throw new Error('Failed to fetch user stats')
      }

      return response.json()
    },
    enabled: !!user && !!session,
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
    if (bio !== userProfile?.bio) {
      updateData.bio = bio.trim() || null
    }
    if (avatarUrl !== userProfile?.avatar_url) {
      updateData.avatar_url = avatarUrl || null
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
    setBio(userProfile?.bio || '')
    setAvatarUrl(userProfile?.avatar_url || null)
    setIsEditing(false)
    setError('')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (isLoading) {
    return <ProfileSkeleton />
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
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="w-24 h-24 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <ImageUploader
                    onImageUploaded={(url) => setAvatarUrl(url)}
                    onImageRemoved={() => setAvatarUrl(null)}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            <h2 className="mt-4 text-xl font-bold text-black">{userProfile?.name || 'Anonymous'}</h2>
            {userProfile?.bio && (
              <p className="mt-2 text-sm text-gray-600 text-center max-w-md">{userProfile.bio}</p>
            )}
          </div>

          {/* Activity Stats */}
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{userStats.posts_count || 0}</div>
                <div className="text-xs text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{userStats.comments_count || 0}</div>
                <div className="text-xs text-gray-600">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{userStats.marketplace_items_count || 0}</div>
                <div className="text-xs text-gray-600">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{userStats.businesses_count || 0}</div>
                <div className="text-xs text-gray-600">Businesses</div>
              </div>
            </div>
          )}

          {/* Join Date & Member Since */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Joined</label>
              <div className="text-black">{formatDate(userProfile?.created_at)}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Neighbourhood Member Since</label>
              <div className="text-black">{neighbourhood ? formatDate(userProfile?.created_at) : 'N/A'}</div>
            </div>
          </div>

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

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black min-h-[60px]">
                {userProfile?.bio || 'No bio yet'}
              </div>
            )}
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
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

