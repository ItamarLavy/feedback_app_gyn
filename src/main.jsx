import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register service worker for PWA (production only)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        console.log('Service worker registration failed');
      });
    });
  } else {
    // In dev mode, unregister any existing service workers to prevent stale cache issues
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)