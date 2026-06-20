import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
  const { signOut, user, profile } = useAuth()
  // Pending users can't read access_requests (RLS), so we track submission locally.
  const submittedKey = user ? `astralis_request_submitted_${user.id}` : ''
  const [submitted, setSubmitted] = useState(
    () => !!submittedKey && localStorage.getItem(submittedKey) === '1'
  )
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!reason.trim() || !user) return
    setBusy(true)
    setError('')
    const { error } = await supabase.from('access_requests').insert({
      name: profile?.name || user.user_metadata?.name || (user.email?.split('@')[0] ?? ''),
      email: user.email ?? '',
      reason: reason.trim(),
      // created_at is logged automatically by the DB (DEFAULT NOW())
    })
    if (error) {
      setError('Could not submit. Try again.')
      setBusy(false)
      return
    }
    localStorage.setItem(submittedKey, '1')
    setSubmitted(true)
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center space-y-5 w-full max-w-sm">
        <p className="font-mono text-xs tracking-widest uppercase text-white/68">
          {submitted ? 'Access Pending' : 'Complete Your Application'}
        </p>

        {submitted ? (
          <p className="font-sans text-sm text-white/55 max-w-xs mx-auto">
            Your application is in. We'll be in touch if selected.
          </p>
        ) : (
          <>
            <p className="font-sans text-sm text-white/55 max-w-xs mx-auto leading-relaxed">
              Tell us why you belong in Astralis.
            </p>
            <textarea
              autoFocus
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 300))}
              placeholder="What you build. Why Astralis."
              className="w-full bg-transparent border-b border-white/25 text-white font-mono text-sm py-3 outline-none focus:border-white/60 transition-colors duration-500 placeholder-white/40 resize-none text-left"
            />
            {error && <p className="font-mono text-[10px] text-amber-200/80">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || !reason.trim()}
              className="font-mono text-[10px] tracking-widest uppercase text-white/62 border border-white/15 px-6 py-3 hover:border-white/40 hover:text-white/80 transition-all duration-500 disabled:opacity-25 disabled:cursor-not-allowed"
            >
              {busy ? 'Submitting…' : 'Submit Application'}
            </button>
          </>
        )}

        {user?.email && (
          <p className="font-mono text-[10px] text-white/32 pt-2">{user.email}</p>
        )}
        <button
          type="button"
          onClick={async () => {
            await signOut()
            window.location.href = '/'
          }}
          className="font-mono text-[10px] tracking-widest uppercase text-white/42 hover:text-white/78 transition-colors duration-500 block mx-auto"
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
