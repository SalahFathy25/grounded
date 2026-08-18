import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, admin = false, superAdmin = false }) {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (admin && !isAdmin) {
    return <Navigate to="/" replace />
  }
  if (superAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />
  }
  return children
}