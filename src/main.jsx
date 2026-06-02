import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './store/AppContext.jsx'
import App from './App.jsx'
import './styles/app.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
