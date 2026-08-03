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
    body: 'We form teams early, prepare properly, and enter to place.',
  },
  {
    index: '02',
    title: 'Placements',
    body: 'We run hard mocks and make introductions based on real work.',
  },
  {
    index: '03',
    title: 'Whatever comes next',
    body: 'If it is worth chasing, someone here is already on it.',
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
        <a
          href="#what-we-are"
          aria-label="Continue to what we are"
          className="absolute bottom-6 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60 sm:bottom-9 sm:h-10 sm:w-10"
        >
          <span className="block h-3 w-3 rotate-45 border-b border-r border-white/45" />
        </a>
      </section>

      <div className="relative z-20 border-t border-white/10 bg-black/90">
        <section id="what-we-are" className="scroll-mt-16 mx-auto max-w-6xl px-4 sm:px-8">
          <div className="py-16">
            <p className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-white/60 sm:text-sm">
            02 // What We Are
            </p>
            <div className="grid gap-8 md:grid-cols-2 md:gap-16">
              <h2 className="font-sans text-[clamp(2.15rem,5vw,4.5rem)] font-light leading-[1.03] tracking-[-0.03em] text-white/90">
                You don't join Astralis.<br />You qualify.
              </h2>
              <p className="max-w-xl self-end font-sans text-[17px] leading-8 text-white/72 sm:text-lg">
                Come with proof. Once you're in, we team up for hackathons, prepare for the right roles, and help each other get hired.
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
                <h3 className="font-sans text-sm text-white/85 sm:text-lg">{pillar.title}</h3>
                <p className="font-sans text-sm leading-6 text-white/65 sm:text-base sm:leading-7">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="mentors" className="scroll-mt-16 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="py-16 font-mono text-xs uppercase tracking-[0.3em] text-white/60 sm:text-sm">
              03 // Mentors
            </p>
            <div className="grid gap-6 border-t border-white/10 py-8 md:grid-cols-[1fr_auto] md:items-center md:gap-16">
              <div>
                <h2 className="max-w-2xl font-sans text-3xl font-light leading-tight text-white/90 sm:text-5xl">
                  We are mentored by individuals who work at
                </h2>
              </div>
              <div className="min-w-0 border-t border-white/10 py-8 md:w-80 md:border-l md:border-t-0 md:py-0 md:pl-10">
                <div className="flex min-w-0 flex-col items-start gap-10 text-[#c8c8c8] md:items-end md:gap-6">
                  <div className="w-fit text-left font-playfair text-[1.75rem] font-bold leading-[1.05] tracking-[-0.5px] md:w-full md:text-right md:text-[clamp(2rem,5vw,2.5rem)]">
                    <span className="block">Goldman</span>
                    <span className="block">Sachs</span>
                  </div>
                  <div className="mr-auto text-left md:mr-0 md:ml-auto md:text-right">
                    <div className="inline-block">
                      <div aria-hidden="true" className="mb-2 grid h-4 w-full grid-cols-[63%_14%_3%_20%] items-end md:mb-1">
                        <span className="h-px bg-[#c8c8c8]/60" />
                        <span className="h-px origin-left -rotate-[18deg] bg-[#c8c8c8]/60" />
                        <span />
                        <span className="h-px bg-[#c8c8c8]/60" />
                      </div>
                      <span className="whitespace-nowrap font-garamond text-[1.65rem] font-medium leading-none tracking-[1px] md:text-[clamp(1.875rem,4.75vw,2.25rem)]">
                        D E Shaw &amp; Co
                      </span>
                    </div>
                  </div>
                  <div className="w-fit text-left font-poppins text-[1.8rem] font-semibold leading-none md:w-full md:text-right md:text-[clamp(2.125rem,5.25vw,2.5rem)]">
                    payu
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="py-16 font-mono text-xs uppercase tracking-[0.3em] text-white/60 sm:text-sm">
              04 // Wins
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
                className="block h-full w-full object-contain object-center grayscale brightness-110 contrast-110"
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
