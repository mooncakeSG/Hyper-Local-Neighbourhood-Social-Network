import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { motion } from 'framer-motion'

export default function NeighbourhoodSelectPage() {
  const [neighbourhoods, setNeighbourhoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState(null)
  const [useGPS, setUseGPS] = useState(false)
  const [manualLocation, setManualLocation] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [locationError, setLocationError] = useState('')
  const navigate = useNavigate()
  const { user, setNeighbourhood, setUser, setSession, session } = useUserStore()

  useEffect(() => {
    fetchNeighbourhoods()
  }, [])

  const fetchNeighbourhoods = async () => {
    try {
      // In dev mode, provide mock neighbourhoods
      if (user?.id?.startsWith('dev-user-')) {
        setNeighbourhoods([
          { id: 'dev-neighbourhood-1', name: 'Development Neighbourhood', city: 'Cape Town' },
          { id: 'dev-neighbourhood-2', name: 'Test Area', city: 'Johannesburg' },
        ])
        setLoading(false)
        return
      }

      // Use backend API instead of direct Supabase query
      const session = useUserStore.getState().session
      const accessToken = session?.access_token || user?.session?.access_token
      
      const headers = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/neighbourhoods`, {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch neighbourhoods')
      }

      const data = await response.json()
      setNeighbourhoods(data || [])
    } catch (err) {
      console.error('Error fetching neighbourhoods:', err)
      // Fallback to empty array if fetch fails
      setNeighbourhoods([])
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance between two coordinates
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in km
  }

  const findNearestNeighbourhood = (latitude, longitude) => {
    // Find the nearest neighbourhood based on coordinates
    let nearest = null
    let minDistance = Infinity

    neighbourhoods.forEach(neighbourhood => {
      if (neighbourhood.latitude && neighbourhood.longitude) {
        const distance = calculateDistance(
          latitude,
          longitude,
          neighbourhood.latitude,
          neighbourhood.longitude
        )
        if (distance < minDistance) {
          minDistance = distance
          nearest = { ...neighbourhood, distance }
        }
      }
    })

    return nearest
  }

  const handleGPSSelect = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setUseGPS(true)
    setLocationError('')
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Find nearest neighbourhood
          const nearest = findNearestNeighbourhood(latitude, longitude)
          
          if (nearest) {
            if (nearest.distance < 50) { // Within 50km
              await selectNeighbourhood(nearest)
            } else {
              setLocationError(`Nearest neighbourhood is ${nearest.distance.toFixed(1)}km away. Please select manually.`)
              setUseGPS(false)
            }
          } else if (neighbourhoods.length > 0) {
            // No coordinates available, show list
            setLocationError('Location detected, but no nearby neighbourhoods found. Please select from the list.')
            setUseGPS(false)
          } else {
            setLocationError('No neighbourhoods available. Please contact support.')
            setUseGPS(false)
          }
        } catch (error) {
          console.error('Error selecting neighbourhood:', error)
          setLocationError('Failed to select neighbourhood. Please try again.')
          setUseGPS(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Failed to get your location. '
        if (error.code === 1) {
          errorMessage += 'Location permission denied. Please enable location access or select manually.'
        } else if (error.code === 2) {
          errorMessage += 'Location unavailable. Please select manually.'
        } else {
          errorMessage += 'Please select a neighbourhood from the list below.'
        }
        setLocationError(errorMessage)
        setUseGPS(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleManualSearch = () => {
    if (!manualLocation.trim()) {
      setLocationError('Please enter a location to search')
      return
    }

    setLocationError('')
    const searchTerm = manualLocation.toLowerCase().trim()
    
    // Search by city or neighbourhood name
    const matches = neighbourhoods.filter(n => 
      n.name.toLowerCase().includes(searchTerm) ||
      (n.city && n.city.toLowerCase().includes(searchTerm)) ||
      (n.province && n.province.toLowerCase().includes(searchTerm))
    )

    if (matches.length === 1) {
      selectNeighbourhood(matches[0])
    } else if (matches.length > 1) {
      // Show matching neighbourhoods
      setNeighbourhoods(matches)
      setShowManualInput(false)
      setLocationError(`Found ${matches.length} matching neighbourhoods. Please select one.`)
    } else {
      setLocationError(`No neighbourhoods found matching "${manualLocation}". Please try a different search term.`)
    }
  }

  const selectNeighbourhood = async (neighbourhood) => {
    try {
      // DEV MODE: Bypass API call and directly set neighbourhood
      const isDevMode = user?.id?.startsWith('dev-user-') || neighbourhood?.id?.startsWith('dev-neighbourhood-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Bypassing API call, setting neighbourhood directly')
        setNeighbourhood(neighbourhood)
        navigate('/')
        return
      }

      // PRODUCTION: Update user's neighbourhood via backend API
      const session = useUserStore.getState().session
      const accessToken = session?.access_token || user?.session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/neighbourhood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ neighbourhood_id: neighbourhood.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update neighbourhood')
      }

      setNeighbourhood(neighbourhood)
      navigate('/')
    } catch (err) {
      console.error('Error selecting neighbourhood:', err)
      alert('Failed to select neighbourhood')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-black">Loading neighbourhoods...</div>
      </div>
    )
  }

  const handleDevMode = () => {
    // Create dev user if not exists
    if (!user || !user.id?.startsWith('dev-user-')) {
      const devUser = {
        id: 'dev-user-1',
        name: 'Dev User',
        email: 'dev@example.com'
      }
      setUser(devUser)
      setSession({ access_token: 'dev-token', refresh_token: null })
    }

    // Set dev neighbourhood and navigate
    const devNeighbourhood = {
      id: 'dev-neighbourhood-1',
      name: 'Development Neighbourhood',
      city: 'Cape Town',
      province: 'Western Cape',
      country: 'South Africa'
    }
    setNeighbourhood(devNeighbourhood)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-black mb-2">Select Your Neighbourhood</h1>
        <p className="text-gray-600 mb-6">Choose your local community</p>

        {/* Developer Mode Button */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">🔧 Developer Mode</p>
                <p className="text-xs text-yellow-700">Skip authentication and use mock data</p>
              </div>
              <button
                onClick={handleDevMode}
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap"
              >
                Enter Dev Mode
              </button>
            </div>
          </motion.div>
        )}

        <div className="mb-6 space-y-3">
          <button
            onClick={handleGPSSelect}
            disabled={useGPS}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {useGPS ? 'Detecting location...' : '📍 Use Current Location'}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {!showManualInput ? (
            <button
              onClick={() => setShowManualInput(true)}
              className="w-full bg-white border-2 border-black text-black py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              🔍 Search by Location
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                  placeholder="Enter city or neighbourhood name..."
                  className="flex-1 px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleManualSearch}
                  className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Search
                </button>
              </div>
              <button
                onClick={() => {
                  setShowManualInput(false)
                  setManualLocation('')
                  setLocationError('')
                  fetchNeighbourhoods() // Reset to show all neighbourhoods
                }}
                className="w-full text-sm text-gray-600 hover:text-black"
              >
                Cancel
              </button>
            </div>
          )}

          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"
            >
              {locationError}
            </motion.div>
          )}
        </div>

        {neighbourhoods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No neighbourhoods available yet.</p>
            <p className="text-sm text-gray-500">Please contact support to add neighbourhoods to the system.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">
              {showManualInput ? 'Search results:' : 'Select from the list:'}
            </p>
            {neighbourhoods.map((neighbourhood) => (
              <motion.button
                key={neighbourhood.id}
                onClick={() => selectNeighbourhood(neighbourhood)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left p-4 border border-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-black">{neighbourhood.name}</div>
                {neighbourhood.city && (
                  <div className="text-sm text-gray-600">{neighbourhood.city}</div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

