import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
    return `font-mono text-[10px] tracking-widest uppercase transition-colors duration-500 ${
      active ? 'text-white/70' : 'text-white/25 hover:text-white/55'
    }`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07]">
        <div className="max-w-4xl mx-auto px-8 h-11 flex items-center justify-between">
          <Link
            to="/"
            className="font-mono text-[10px] tracking-widest uppercase text-white/20 hover:text-white/45 transition-colors duration-500"
          >
            Astralis
          </Link>
          <nav className="flex items-center gap-8">
            <Link to="/dashboard" className={navClass('/dashboard')}>
              Feed
            </Link>
            <Link to="/chat" className={navClass('/chat')}>
              Channel
            </Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className={navClass('/admin')}>
                Admin
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="font-mono text-[10px] tracking-widest uppercase text-white/15 hover:text-white/40 transition-colors duration-500"
            >
              Exit
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-11">
        <Outlet />
      </main>
    </div>
  )
}
