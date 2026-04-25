import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import './i18n'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

/**
 * CartBridge reads the authenticated user id from AuthContext and passes it
 * down to CartProvider so the cart can load/save to the DB for the right user.
 */
function CartBridge({ children }) {
  const { user } = useAuth();
  return <CartProvider userId={user?.id}>{children}</CartProvider>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartBridge>
          <Toaster position="top-center" />
          <App />
        </CartBridge>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
