import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
