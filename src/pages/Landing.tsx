import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import AstralisBackground from '../components/AstralisBackground'
import AstralisLogo from '../components/AstralisLogo'
import { useAuth } from '../contexts/AuthContext'

const pillars = [
  {
    index: '01',
    title: 'Hackathons',
    body: 'We form teams before the brief drops and enter expecting to place. When a team clicks, it keeps building after the event ends.',
  },
  {
    index: '02',
    title: 'Placements',
    body: 'The right opening helps. So does a hard mock interview, or an introduction from someone who has actually seen your work.',
  },
  {
    index: '03',
    title: 'Whatever comes next',
    body: 'New competitions, new companies, new roles. If something is worth chasing, someone here is already on it.',
  },
]

const featuredWins = [
  {
    image: '/hackbmu-8-team-noir.png',
    alt: 'Team Noir receiving third place certificates at HackBMU 8.0',
    label: '18–19 April 2026 // HackBMU 8.0',
    headline: 'Team Noir takes third among 100+ teams.',
  },
  {
    image: '/orbix-team-monarch.png',
    alt: 'Team Monarch holding the ORBIX winners trophy at IIIT Delhi',
    label: '25–26 March 2026 // ORBIX',
    headline: 'Team Monarch wins ORBIX at IIIT Delhi.',
  },
]

export default function Landing() {
  const [activeWin, setActiveWin] = useState(0)
  const { user, profile } = useAuth()
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const letterSpacing = useTransform(scrollYProgress, [0, 0.2], ['0.2em', '0.13em'])
  const featuredWin = featuredWins[activeWin]
  const memberName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Member'
  const memberInitials = memberName
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (reducedMotion) return
    const timer = window.setInterval(
      () => setActiveWin((current) => (current + 1) % featuredWins.length),
      6000,
    )
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  return (
    <main className="relative w-full overflow-x-hidden bg-black text-white selection:bg-white selection:text-black">
      <AstralisBackground />
      <div className="pointer-events-none fixed inset-0 z-10 bg-black/45" />

      <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur-sm sm:px-8">
        <Link to="/" aria-label="Astralis home">
          <AstralisLogo className="h-9 w-9" />
        </Link>
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 sm:gap-7 sm:text-[11px]">
          <Link to="/members" viewTransition className="transition-colors hover:text-white">Members</Link>
          {user ? (
            <Link to="/dashboard" className="transition-colors hover:text-white">
              <span className="sm:hidden">{memberInitials}</span>
              <span className="hidden sm:inline">{memberName.split(' ')[0]}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden transition-colors hover:text-white sm:inline">Sign In</Link>
              <Link to="/request" className="transition-colors hover:text-white">Request Access</Link>
            </>
          )}
        </div>
      </nav>

      <section className="relative z-20 flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <div className="flex max-w-full flex-col items-center">
          <motion.h1
            style={{ letterSpacing: reducedMotion ? '0.2em' : letterSpacing }}
            aria-label="Astralis"
            className="mb-4 flex items-center justify-center gap-[0.12em] pl-[0.1em] font-sans text-[clamp(3.15rem,14vw,10rem)] font-light uppercase leading-none"
          >
            <img
              src="/astralis-logo.png"
              alt=""
              aria-hidden="true"
              className="h-[1.2em] w-[1.2em] shrink-0 object-contain"
            />
            <span>Stralis</span>
          </motion.h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/60 sm:text-xs sm:tracking-[0.35em]">
            Not a club. A cartel.
          </p>
          <Link
            to={user ? '/dashboard' : '/request'}
            className="mt-10 border border-white/30 px-8 py-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:bg-white hover:text-black sm:px-12 sm:text-[10px]"
          >
            {user ? 'Enter Astralis' : 'Request Access'}
          </Link>
        </div>
      </section>

      <div className="relative z-20 border-t border-white/10 bg-black/90">
        <section className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="py-16">
            <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 sm:text-[11px]">
            02 // What We Are
            </p>
            <div className="grid gap-8 md:grid-cols-2 md:gap-16">
              <h2 className="font-sans text-[clamp(2.15rem,5vw,4.5rem)] font-light leading-[1.03] tracking-[-0.03em] text-white/90">
                You don't join Astralis.<br />You qualify.
              </h2>
              <p className="max-w-xl self-end font-sans text-[15px] leading-7 text-white/72 sm:text-base">
                Astralis only takes people who have already won something. A hackathon podium, a case competition, a national round. Once you're in, the work is simple: we enter together, prepare properly, and get each other hired.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10">
            {pillars.map((pillar) => (
              <div
                key={pillar.index}
                className="grid grid-cols-[2rem_6.75rem_1fr] gap-2 border-b border-white/10 py-6 transition-colors hover:bg-white/[0.03] sm:grid-cols-[4rem_12rem_1fr] sm:gap-4 sm:px-3"
              >
                <span className="font-mono text-[9px] text-white/50 sm:text-[11px]">{pillar.index} /</span>
                <h3 className="font-sans text-xs text-white/85 sm:text-base">{pillar.title}</h3>
                <p className="font-sans text-[11px] leading-5 text-white/65 sm:text-[15px] sm:leading-6">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="py-16 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 sm:text-[11px]">
              03 // Wins
            </p>
            <figure
              className="relative mx-auto mb-8 max-w-full overflow-hidden border border-white/10 bg-black"
              style={{
                aspectRatio: '4 / 3',
                width: 'min(100%, 106.667dvh)',
              }}
            >
              <motion.img
                key={featuredWin.image}
                src={featuredWin.image}
                alt={featuredWin.alt}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="block h-full w-full object-contain object-center grayscale contrast-125 brightness-75"
              />
              <figcaption aria-live="polite" className="absolute bottom-0 left-0 w-full border-r border-t border-white/15 bg-black/95 px-5 py-5 sm:max-w-[58%] sm:px-8 sm:py-7">
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/60 sm:text-[10px]">
                  {featuredWin.label}
                </p>
                <h3 className="font-sans text-xl font-light leading-tight text-white sm:text-2xl">
                  {featuredWin.headline}
                </h3>
              </figcaption>
              <div className="absolute right-0 top-0 flex items-center border-b border-l border-white/15 bg-black/95 font-mono text-[9px] text-white/65">
                <button
                  type="button"
                  aria-label="Previous win"
                  onClick={() => setActiveWin((activeWin - 1 + featuredWins.length) % featuredWins.length)}
                  className="px-4 py-3 transition-colors hover:bg-white hover:text-black"
                >
                  ←
                </button>
                <span className="border-x border-white/15 px-4 py-3">
                  {String(activeWin + 1).padStart(2, '0')} / {String(featuredWins.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  aria-label="Next win"
                  onClick={() => setActiveWin((activeWin + 1) % featuredWins.length)}
                  className="px-4 py-3 transition-colors hover:bg-white hover:text-black"
                >
                  →
                </button>
              </div>
            </figure>
          </div>
        </section>

        <footer className="border-t border-white/10 px-4 py-7 text-center font-mono text-[9px] uppercase tracking-widest text-white/45 sm:text-[10px]">
          Astralis © 2026
        </footer>
      </div>
    </main>
  )
}
