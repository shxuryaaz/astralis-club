import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AstralisBackground from '../components/AstralisBackground'

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Once auth state resolves with a user, redirect to dashboard.
  // This handles both the "already logged in" case and the post-login redirect —
  // no manual navigate() needed, which avoids the race where the route renders
  // before the auth state has propagated.
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signIn(email.trim(), password)

    if (error) {
      setSubmitting(false)
      setError(error.message?.trim() || 'Sign in failed.')
      return
    }

    // Don't call navigate() here. onAuthStateChange will fire, set loading=true,
    // fetch the profile, then set loading=false with user set — at which point
    // the `if (!loading && user)` guard above redirects automatically.
    // Keeping submitting=true gives visual feedback until that redirect happens.
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center overflow-hidden">
      <AstralisBackground />

      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }}
      />

      <div className="relative z-20 w-full max-w-xs px-6 md:px-8">
        <div className="mb-14">
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/25">Astralis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-7">
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/30">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@domain.com"
                className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-3 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/15"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/30">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-3 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/15"
              />
            </div>
          </div>

          {error && <p className="font-mono text-[10px] tracking-wider text-white/35">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-white/15 text-white/50 font-mono text-[10px] tracking-widest uppercase py-4 hover:border-white/40 hover:text-white/80 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Authenticating' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
