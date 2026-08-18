import { createContext, useContext, useMemo, useState } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('sv_user')) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [authLoading, setAuthLoading] = useState(false)

  const login = async (email, password) => {
    setAuthLoading(true)
    try {
      const data = await authApi.login({ email, password })
      localStorage.setItem('sv_token', data.token)
      localStorage.setItem('sv_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setAuthLoading(false)
    }
  }

  const register = async ({ full_name, email, password }) => {
    setAuthLoading(true)
    try {
      const data = await authApi.register({ full_name, email, password })
      return data
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('sv_token')
    localStorage.removeItem('sv_user')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      authLoading,
      login,
      register,
      logout,
      isAdmin: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(user?.role),
      isSuperAdmin: user?.role === 'ROLE_SUPER_ADMIN',
    }),
    [user, authLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)