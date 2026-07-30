import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import AstralisBackground from '../components/AstralisBackground'
import AstralisLogo from '../components/AstralisLogo'

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

const wins = [
  {
    event: 'Hacked 4.0',
    result: 'Top 7 of 100+ teams',
    detail: 'Built a multi-agent trading arena in 24 hours.',
    href: 'https://www.linkedin.com/posts/shauryasingh28_built-a-multi-agent-trading-arena-for-a-hackathon-activity-7441831619688280064-vqvf',
  },
  {
    event: 'Techpreneur 2026',
    result: '7th of 75+ qualified teams',
    detail: 'Built Runway, an execution engine for early-stage startups.',
    href: 'https://www.linkedin.com/posts/shauryasingh28_close-enough-to-feel-proud-far-enough-to-activity-7428327204259893248-v8d2',
  },
  {
    event: 'EY Techathon 6.0',
    result: 'Advanced to round two',
    detail: 'A solo submission selected from more than 1.8 lakh participants.',
    href: 'https://www.linkedin.com/posts/shauryasingh28_just-qualified-for-techathons-2nd-round-activity-7408520644721725440-RP_w',
  },
]

export default function Landing() {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const letterSpacing = useTransform(scrollYProgress, [0, 0.2], ['0.2em', '0.13em'])

  return (
    <main className="relative w-full overflow-x-hidden bg-black text-white selection:bg-white selection:text-black">
      <AstralisBackground />
      <div className="pointer-events-none fixed inset-0 z-10 bg-black/45" />

      <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur-sm sm:px-8">
        <Link to="/" aria-label="Astralis home">
          <AstralisLogo className="h-9 w-9" />
        </Link>
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 sm:gap-7 sm:text-[11px]">
          <Link to="/members" className="transition-colors hover:text-white">Members</Link>
          <Link to="/login" className="hidden transition-colors hover:text-white sm:inline">Sign In</Link>
          <Link to="/request" className="transition-colors hover:text-white">Request Access</Link>
        </div>
      </nav>

      <section className="relative z-20 flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <div className="flex max-w-full flex-col items-center">
          <motion.h1
            style={{ letterSpacing: reducedMotion ? '0.2em' : letterSpacing }}
            className="mb-4 pl-[0.2em] font-sans text-[clamp(3.15rem,14vw,10rem)] font-light uppercase leading-none"
          >
            Astralis
          </motion.h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/60 sm:text-xs sm:tracking-[0.35em]">
            Not a club. A cartel.
          </p>
          <Link
            to="/request"
            className="mt-10 border border-white/30 px-8 py-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:bg-white hover:text-black sm:px-12 sm:text-[10px]"
          >
            Request Access
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
          </div>
          <div className="mx-auto max-w-6xl border-t border-white/10 px-4 sm:px-8">
            {wins.map((win) => (
              <a
                key={win.event}
                href={win.href}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[minmax(7rem,1fr)_minmax(8rem,1.2fr)] gap-3 border-b border-white/10 py-6 transition-colors hover:bg-white/[0.03] sm:grid-cols-[12rem_15rem_1fr] sm:px-3"
              >
                <p className="font-sans text-xs text-white/85 sm:text-base">{win.event}</p>
                <p className="font-mono text-[9px] uppercase leading-5 tracking-wider text-white/65 sm:text-[11px]">{win.result}</p>
                <p className="hidden font-sans text-[15px] leading-6 text-white/60 sm:block">{win.detail}</p>
              </a>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 px-4 py-7 text-center font-mono text-[9px] uppercase tracking-widest text-white/45 sm:text-[10px]">
          Astralis © 2026
        </footer>
      </div>
    </main>
  )
}
