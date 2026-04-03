import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Loader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="font-mono text-xs tracking-widest uppercase text-white/20">
        Loading
      </span>
    </div>
  )
}

function AccessPending() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="font-mono text-xs tracking-widest uppercase text-white/40">
          Access Pending
        </p>
        <p className="font-sans text-sm text-white/20 max-w-xs">
          Your account is awaiting approval.
        </p>
      </div>
    </div>
  )
}

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth()

  // Wait for both auth + profile to resolve
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  // Profile loaded but not approved (or doesn't exist)
  if (!profile?.approved) return <AccessPending />

  return <Outlet />
}

export function AdminRoute() {
  const { profile, loading } = useAuth()

  if (loading) return <Loader />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
