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
  const navigate = useNavigate()
  const { user, setNeighbourhood } = useUserStore()

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

      const { data, error } = await supabase
        .from('neighbourhoods')
        .select('*')
        .order('name')

      if (error) throw error
      setNeighbourhoods(data || [])
    } catch (err) {
      console.error('Error fetching neighbourhoods:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGPSSelect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setUseGPS(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Find nearest neighbourhood (simplified - would need proper geospatial query)
        const { data, error } = await supabase
          .from('neighbourhoods')
          .select('*')
          .limit(1)

        if (data && data.length > 0) {
          await selectNeighbourhood(data[0])
        } else {
          alert('No neighbourhood found near your location')
          setUseGPS(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Failed to get your location')
        setUseGPS(false)
      }
    )
  }

  const selectNeighbourhood = async (neighbourhood) => {
    try {
      // In dev mode, skip Supabase update
      if (user?.id?.startsWith('dev-user-')) {
        setNeighbourhood(neighbourhood)
        navigate('/')
        return
      }

      // Update user's neighbourhood
      const { error } = await supabase
        .from('users')
        .update({ neighbourhood_id: neighbourhood.id })
        .eq('id', user.id)

      if (error) throw error

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

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-black mb-2">Select Your Neighbourhood</h1>
        <p className="text-gray-600 mb-6">Choose your local community</p>

        <button
          onClick={handleGPSSelect}
          disabled={useGPS}
          className="w-full mb-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {useGPS ? 'Detecting location...' : 'Use Current Location'}
        </button>

        <div className="space-y-2">
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
      </motion.div>
    </div>
  )
}

