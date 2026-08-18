import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { LangProvider } from './context/LangContext'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import { ContentProvider } from './context/ContentContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
        <LangProvider>
          <SettingsProvider>
            <ContentProvider>
              <ToastProvider>
                <AuthProvider>
                  <CartProvider>
                    <App />
                  </CartProvider>
                </AuthProvider>
              </ToastProvider>
            </ContentProvider>
          </SettingsProvider>
        </LangProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)