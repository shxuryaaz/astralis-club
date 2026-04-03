import { useState, FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AstralisBackground from '../components/AstralisBackground'

export default function Login() {
  const { user, profile, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signIn(email, password)
    setSubmitting(false)

    if (error) {
      setError('Invalid credentials.')
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center overflow-hidden">
      <AstralisBackground />

      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div className="relative z-20 w-full max-w-xs px-8">
        <div className="mb-14">
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/25">
            Astralis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-7">
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/30">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@domain.com"
                className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-2 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/15"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/30">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-2 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/15"
              />
            </div>
          </div>

          {error && (
            <p className="font-mono text-[10px] tracking-wider text-white/35">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-white/15 text-white/50 font-mono text-[10px] tracking-widest uppercase py-3 hover:border-white/40 hover:text-white/80 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Authenticating' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
