import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AstralisLogo from './AstralisLogo'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function navClass(path: string) {
    const active = location.pathname === path
    return `font-mono text-[8px] sm:text-[9px] tracking-[0.08em] sm:tracking-[0.14em] uppercase transition-colors ${
      active ? 'text-[#d8d8d8]' : 'text-white/35 hover:text-white/75'
    }`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
          <Link
            to="/"
            aria-label="Astralis home"
          >
            <AstralisLogo className="h-8 w-8" />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6 md:gap-8" aria-label="Member navigation">
            <Link to="/dashboard" className={navClass('/dashboard')}>Today</Link>
            <Link to="/chat" className={navClass('/chat')}>Commons</Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className={navClass('/admin')}>Admin</Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/25 transition-colors hover:text-white/65 sm:text-[9px] sm:tracking-[0.14em]"
            >
              Exit
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  )
}
