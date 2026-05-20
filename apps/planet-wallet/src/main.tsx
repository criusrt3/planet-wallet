import '@repo/ui/globals.css'
import './app.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@repo/ui/components/sonner'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  </StrictMode>,
)
