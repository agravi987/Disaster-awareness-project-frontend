/**
 * src/main.jsx - React Application Entry Point
 * 
 * This is the very first JavaScript file that runs.
/**
 * src/main.jsx - React Application Entry Point
 * 
 * This is the very first JavaScript file that runs.
 * It renders the root <App /> component into the #root div in index.html.
 * 
 * React.StrictMode helps identify potential problems during development
 * by intentionally double-rendering components to detect side effects.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
