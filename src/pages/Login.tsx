import { useState, FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AstralisBackground from '../components/AstralisBackground'
import AstralisLogo from '../components/AstralisLogo'

function GoogleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  async function handleGoogle() {
    setError('')
    setGoogleBusy(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

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
      const message = error.message?.toLowerCase() ?? ''
      setError(
        message.includes('invalid login credentials')
          ? 'That password did not work. If you joined with Google, use Continue with Google below.'
          : error.message?.trim() || 'Sign in failed.'
      )
      return
    }

    // Don't call navigate() here. onAuthStateChange will fire, set loading=true,
    // fetch the profile, then set loading=false with user set — at which point
    // the `if (!loading && user)` guard above redirects automatically.
    // Keeping submitting=true gives visual feedback until that redirect happens.
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-black py-16 text-white">
      <AstralisBackground />

      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(27,27,27,0.88) 100%)' }}
      />

      <div className="relative z-20 w-full max-w-xs px-6 md:px-8">
        <div className="mb-14">
          <Link to="/" aria-label="Astralis home">
            <AstralisLogo className="h-10 w-10" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-7">
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/55">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@domain.com"
                className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-3 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/32"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/55">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-3 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/32"
              />
            </div>
          </div>

          {error && <p className="font-mono text-[10px] tracking-wider text-white/62">{error}</p>}

          <button
            type="submit"
            disabled={submitting || googleBusy}
            className="w-full border border-white/15 text-white/78 font-mono text-[10px] tracking-widest uppercase py-4 hover:border-white/40 hover:text-white/80 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Authenticating' : 'Enter'}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] text-white/32 tracking-widest">or</span>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleBusy || submitting}
            className="w-full border border-white/10 text-white/55 font-mono text-[10px] tracking-widest uppercase py-4 hover:border-white/25 hover:text-white/60 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            {googleBusy ? 'Redirecting' : 'Continue with Google'}
          </button>
        </div>

        <p className="mt-12 text-center font-mono text-[10px] tracking-widest uppercase text-white/32">
          Not a member yet?{' '}
          <Link
            to="/request"
            className="text-white/55 hover:text-white/80 transition-colors duration-500"
          >
            Request access
          </Link>
        </p>
      </div>
    </div>
  )
}
