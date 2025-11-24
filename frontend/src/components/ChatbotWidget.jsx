import { useState } from 'react'
import { useUserStore } from '../store/useUserStore'
import NeighbourBot from './chatbot/NeighbourBot'

export default function ChatbotWidget() {
  const { session, neighbourhood, setNeighbourhood } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!session || !neighbourhood) {
    return null
  }

  const jwtToken = session?.access_token
  const apiBase = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`
  const neighbourhoodId = neighbourhood?.id

  const handleNeighbourhoodUpdate = (newNeighbourhoodId) => {
    // Update neighbourhood in store if needed
    if (newNeighbourhoodId && newNeighbourhoodId !== neighbourhoodId) {
      // You might want to fetch the full neighbourhood object here
      console.log('Neighbourhood updated to:', newNeighbourhoodId)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-40 right-4 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-50"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
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
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-4 w-96 h-[600px] bg-white border border-black rounded-lg shadow-2xl z-40 flex flex-col overflow-hidden">
          <NeighbourBot
            jwtToken={jwtToken}
            apiBase={apiBase}
            neighbourhoodId={neighbourhoodId}
            onNeighbourhoodUpdate={handleNeighbourhoodUpdate}
            useBackend={false}
          />
        </div>
      )}
    </>
  )
}

