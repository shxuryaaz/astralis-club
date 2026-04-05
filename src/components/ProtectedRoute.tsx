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
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-5">
        <p className="font-mono text-xs tracking-widest uppercase text-white/40">
          Access Pending
        </p>
        <p className="font-sans text-sm text-white/20 max-w-xs">
          Your account is awaiting approval.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="font-mono text-[10px] tracking-widest uppercase text-white/20 hover:text-white/50 transition-colors duration-500"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth()

  // Wait for both auth + profile to resolve
  // loading is reset to true inside AuthContext whenever a profile fetch starts,
  // so this single check covers both the initial load and post-login fetch.
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />

  // Admins always pass — otherwise an admin with approved=false (DB default) can never
  // reach /admin to approve anyone, including themselves.
  const hasAccess = profile?.role === 'admin' || profile?.approved === true
  if (!hasAccess) return <AccessPending />

  return <Outlet />
}

export function AdminRoute() {
  const { profile, loading } = useAuth()

  if (loading) return <Loader />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
