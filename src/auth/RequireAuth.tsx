import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, loggedIn } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="auth-loading" aria-busy="true" />
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
