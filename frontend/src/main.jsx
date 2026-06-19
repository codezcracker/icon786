import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { addAPIProvider } from '@iconify/react'
import './index.css'
import App from './App.jsx'

// Load icons from our backend (@iconify/json on disk), not api.iconify.design
const iconifyBase = import.meta.env.VITE_API_URL?.trim()
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/icons/iconify`
  : '/api/icons/iconify'

addAPIProvider('', {
  resources: [iconifyBase],
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
