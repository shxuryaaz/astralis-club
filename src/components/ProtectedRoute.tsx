import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Loader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="font-mono text-xs tracking-widest uppercase text-white/42">
        Loading
      </span>
    </div>
  )
}

function AccessPending() {
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center space-y-5 w-full max-w-sm">
        <p className="font-mono text-xs tracking-widest uppercase text-white/68">
          Access Pending
        </p>
        <p className="font-sans text-sm text-white/55 max-w-xs mx-auto">
          Open your application to complete it or check its status.
        </p>
        {user?.email && (
          <p className="font-mono text-[10px] text-white/32 pt-2">{user.email}</p>
        )}
        <div className="flex justify-center gap-6 pt-2 font-mono text-[10px] uppercase tracking-widest text-white/42">
          <Link to="/request" className="hover:text-white/78 transition-colors">Application</Link>
          <Link to="/" className="hover:text-white/78 transition-colors">Return home</Link>
          <button
            type="button"
            onClick={async () => {
              await signOut()
              window.location.href = '/'
            }}
            className="hover:text-white/78 transition-colors"
          >
            Sign out
          </button>
        </div>
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
