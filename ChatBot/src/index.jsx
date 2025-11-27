import React from 'react';
import ReactDOM from 'react-dom/client';
import NeighbourBot from './components/NeighbourBot';
import { testGroq } from './utils/testGroq';
import './index.css';

// Make testGroq available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testGroq = testGroq;
  console.log('💡 Tip: Run testGroq() in the console to test your Groq API key');
}

// Get configuration from URL parameters or window
const getConfig = () => {
  const params = new URLSearchParams(window.location.search);
  const config = {
    jwtToken: params.get('token') || window.parent?.neighbourbotToken || null,
    apiBase: params.get('apiBase') || window.parent?.neighbourbotApiBase || '/api/v1',
    neighbourhoodId: params.get('neighbourhoodId') || window.parent?.neighbourbotNeighbourhoodId || null,
    backendUrl: params.get('backendUrl') || window.parent?.neighbourbotBackendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
    useBackend: params.get('useBackend') !== 'false' && (window.parent?.neighbourbotUseBackend !== false),
  };
  return config;
};

const App = () => {
  const config = getConfig();
  
  const handleNeighbourhoodUpdate = (newNeighbourhoodId) => {
    // Notify parent window if in iframe
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'neighbourhood_updated',
        neighbourhoodId: newNeighbourhoodId,
      }, '*');
    }
  };

  return (
    <div className="app">
      <NeighbourBot
        jwtToken={config.jwtToken}
        apiBase={config.apiBase}
        neighbourhoodId={config.neighbourhoodId}
        onNeighbourhoodUpdate={handleNeighbourhoodUpdate}
        backendUrl={config.backendUrl}
        useBackend={config.useBackend}
      />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

