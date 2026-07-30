import { Link } from 'react-router-dom'
import AstralisBackground from '../components/AstralisBackground'
import AstralisLogo from '../components/AstralisLogo'

export default function Members() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black px-4 py-24 text-white sm:px-8">
      <AstralisBackground />
      <div className="pointer-events-none fixed inset-0 z-10 bg-black/60" />
      <div className="relative z-20 mx-auto max-w-6xl">
        <Link to="/" aria-label="Astralis home">
          <AstralisLogo className="h-10 w-10" />
        </Link>
        <p className="mt-16 border-b border-white/10 pb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          01 // Members
        </p>
        <a
          href="https://www.linkedin.com/in/shauryasingh28/"
          target="_blank"
          rel="noreferrer"
          className="grid gap-2 border-b border-white/10 py-7 transition-colors hover:bg-white/[0.03] sm:grid-cols-[1fr_1fr_auto] sm:px-3"
        >
          <span className="font-sans text-base text-white/80">Shaurya Singh</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
            Founding Engineer at Agilow · AI/ML Engineer
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">LinkedIn ↗</span>
        </a>
      </div>
    </main>
  )
}
