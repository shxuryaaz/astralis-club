import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import AstralisBackground from '../components/AstralisBackground'
import AstralisLogo from '../components/AstralisLogo'
import { useAuth } from '../contexts/AuthContext'

const pillars = [
  {
    index: '01',
    title: 'The Weekends',
    body: 'Treks, sports, house parties, jam nights. Every week, something real.',
  },
  {
    index: '02',
    title: 'The Room',
    body: 'Closed-door roundtables. Real numbers, real talk.',
  },
  {
    index: '03',
    title: 'The Network',
    body: 'The right intro at the right time. We back each other.',
  },
]

const roomEvents = [
  {
    index: '01',
    title: 'AMAs',
    body: 'Our mentors, unfiltered. Goldman Sachs, D.E. Shaw, PayU.',
  },
  {
    index: '02',
    title: 'Build Nights',
    body: 'Turn up with nothing. Leave with something shipped.',
  },
  {
    index: '03',
    title: 'The Table',
    body: 'Small rooms. No badges, no networking scripts.',
  },
]

const proofMoments = [
  {
    type: 'Room',
    image: '/anthropic-claude-code-delhi.png',
    alt: 'Astralis speaking at the Anthropic Claude Code event in Delhi',
    label: '12 July 2026 // Anthropic Claude Code Event, Delhi',
    headline: 'An Astralis member spoke on one engineer, one startup, zero bottlenecks. Live agentic build, in front of a room of senior engineers.',
  },
  {
    type: 'Room',
    image: '/founder-investor-meetup-hilton-works.png',
    alt: 'An Astralis member hosting a founder and investor meetup at Hilton Works',
    label: 'Founder × Investor Meetup, Hilton Works',
    headline: 'An Astralis member built the room in seven days. 50+ founders and investors showed up.',
  },
]

export default function Landing() {
  const [activeProof, setActiveProof] = useState(0)
  const { user, profile } = useAuth()
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const letterSpacing = useTransform(scrollYProgress, [0, 0.2], ['0.2em', '0.13em'])
  const proofMoment = proofMoments[activeProof]
  const memberName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Member'
  const memberInitials = memberName
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()

  return (
    <main className="relative w-full overflow-x-hidden bg-black text-white selection:bg-white selection:text-black">
      <AstralisBackground />
      <div className="pointer-events-none fixed inset-0 z-10 bg-black/45" />

      <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur-sm sm:px-8">
        <Link to="/" aria-label="Astralis home">
          <AstralisLogo className="h-9 w-9" />
        </Link>
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 sm:gap-7 sm:text-[11px]">
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
            Not a community. A cartel.
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
        <section id="what-we-are" className="scroll-mt-16 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="border-b border-white/15 pb-6 font-mono text-xs uppercase tracking-[0.4em] text-white/75 sm:text-sm"
            >
              02 // What We Are
            </motion.p>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.32, delay: 0.06, ease: 'easeOut' }}
              className="grid gap-8 pt-16 sm:pt-20 md:grid-cols-2 md:gap-16"
            >
              <h2 className="font-sans text-[clamp(2.15rem,5vw,4.5rem)] font-light leading-[1.03] tracking-[-0.03em] text-white/90">
                You don't join Astralis.<br />You qualify.
              </h2>
              <p className="max-w-xl self-end font-sans text-[17px] leading-8 text-white/72 sm:text-lg">
                Astralis is a community of people who Dominate. Founders, builders, competitors. We ship stuff, we back each other, and we run nights where only the best show up. Come with proof.
              </p>
            </motion.div>
            <div className="mt-16 border-t border-white/10 sm:mt-20">
              {pillars.map((pillar, index) => (
                <motion.div
                  key={pillar.index}
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
                  className="grid grid-cols-[2rem_6.75rem_1fr] gap-2 border-b border-white/10 py-6 transition-colors hover:bg-white/[0.03] sm:grid-cols-[4rem_12rem_1fr] sm:gap-4 sm:px-3"
                >
                  <span className="font-mono text-[9px] text-white/50 sm:text-[11px]">{pillar.index} /</span>
                  <h3 className="font-sans text-sm text-white/85 sm:text-lg">{pillar.title}</h3>
                  <p className="font-sans text-sm leading-6 text-white/65 sm:text-base sm:leading-7">{pillar.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="mentors" className="scroll-mt-16 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="border-b border-white/15 pb-6 font-mono text-xs uppercase tracking-[0.4em] text-white/75 sm:text-sm"
            >
              03 // Mentors
            </motion.p>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.32, delay: 0.06, ease: 'easeOut' }}
              className="grid gap-10 pt-16 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,34rem)] lg:items-center lg:gap-16"
            >
              <div>
                <h2 className="max-w-2xl font-sans text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1.08] tracking-[-0.025em] text-white/90">
                  We are mentored by individuals who work at
                </h2>
              </div>
              <div className="min-w-0 border-t border-white/10 pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <div className="grid min-w-0 grid-cols-1 text-[#c8c8c8] sm:grid-cols-2">
                  <div className="flex h-32 items-center justify-center px-6 py-6 sm:h-40">
                    <div className="text-center font-playfair text-[1.75rem] font-bold leading-[1.05] tracking-[-0.5px] md:text-[clamp(2rem,5vw,2.5rem)]">
                      <span className="block">Goldman</span>
                      <span className="block">Sachs</span>
                    </div>
                  </div>
                  <div className="flex h-32 items-center justify-center px-6 py-6 sm:h-40">
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
                  <div className="flex h-32 items-center justify-center px-6 py-6 sm:h-40">
                    <div className="font-poppins text-[1.8rem] font-semibold leading-none md:text-[clamp(2.125rem,5.25vw,2.5rem)]">
                      payu
                    </div>
                  </div>
                  <div className="flex h-32 items-center justify-center px-6 py-6 sm:h-40">
                    <div
                      role="img"
                      aria-label="MakeMyTrip"
                      className="flex w-fit items-center gap-0 whitespace-nowrap font-poppins text-[1.55rem] font-semibold leading-none text-[#c8c8c8] md:text-[clamp(1.875rem,4.5vw,2.25rem)]"
                    >
                      <span aria-hidden="true">make</span>
                      <span
                        aria-hidden="true"
                        className="flex h-[1.25em] w-[1.25em] shrink-0 items-center justify-center rounded-[22%] bg-[#c8c8c8] text-[#1b1b1b]"
                      >
                        <span className="translate-y-[0.08em] -rotate-2 font-kalam text-[1.08em] font-bold leading-none">
                          my
                        </span>
                      </span>
                      <span aria-hidden="true">trip</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32">
            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="border-b border-white/15 pb-6 font-mono text-xs uppercase tracking-[0.4em] text-white/75 sm:text-sm"
            >
              04 // Rooms
            </motion.p>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.32, delay: 0.06, ease: 'easeOut' }}
              className="grid gap-8 pt-16 sm:pt-20 md:grid-cols-2 md:gap-16"
            >
              <h2 className="font-sans text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1.08] tracking-[-0.025em] text-white/90">
                We get called into rooms that matter<br />and we run our own.
              </h2>
              <p className="max-w-xl self-end font-sans text-[17px] leading-8 text-white/72 sm:text-lg">
                AMAs, build nights, sessions where people who've actually shipped do the talking. Anyone can show up. Not everyone gets to stay.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-8 sm:pb-32">
            <div className="border-t border-white/10">
              <p className="py-8 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 sm:text-xs">
                What We Run
              </p>
              <div className="border-t border-white/10">
                {roomEvents.map((event, index) => (
                  <motion.div
                    key={event.index}
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
                    className="grid grid-cols-[2rem_6.75rem_1fr] gap-2 border-b border-white/10 py-6 transition-colors hover:bg-white/[0.03] sm:grid-cols-[4rem_12rem_1fr] sm:gap-4 sm:px-3"
                  >
                    <span className="font-mono text-[9px] text-white/50 sm:text-[11px]">{event.index} /</span>
                    <h3 className="font-sans text-sm text-white/85 sm:text-lg">{event.title}</h3>
                    <p className="font-sans text-sm leading-6 text-white/65 sm:text-base sm:leading-7">{event.body}</p>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </section>

        <section className="border-b border-white/10 pb-24 sm:pb-32">
          <div className="mx-auto max-w-6xl px-4 pt-24 sm:px-8 sm:pt-32">
            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="border-b border-white/15 pb-6 font-mono text-xs uppercase tracking-[0.4em] text-white/75 sm:text-sm"
            >
              05 // Proof
            </motion.p>
          </div>
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <motion.figure
              tabIndex={0}
              aria-label="Astralis proof gallery"
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  setActiveProof((activeProof - 1 + proofMoments.length) % proofMoments.length)
                }
                if (event.key === 'ArrowRight') {
                  setActiveProof((activeProof + 1) % proofMoments.length)
                }
              }}
              initial={reducedMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative mx-auto mt-16 max-w-full overflow-hidden border border-white/10 bg-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60 sm:mt-20"
              style={{
                width: 'min(100%, 106.667dvh)',
              }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <motion.img
                  key={proofMoment.image}
                  src={proofMoment.image}
                  alt={proofMoment.alt}
                  draggable={false}
                  drag={reducedMotion ? false : 'x'}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.08}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) {
                      setActiveProof((activeProof + 1) % proofMoments.length)
                    }
                    if (info.offset.x > 50) {
                      setActiveProof((activeProof - 1 + proofMoments.length) % proofMoments.length)
                    }
                  }}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className="block h-full w-full object-contain object-center grayscale brightness-110 contrast-110"
                />
                <div className="absolute right-0 top-0 flex items-center border-b border-l border-white/15 bg-black/95 font-mono text-[9px] text-white/65">
                  <button
                    type="button"
                    aria-label="Previous proof"
                    onClick={() => setActiveProof((activeProof - 1 + proofMoments.length) % proofMoments.length)}
                    className="px-4 py-3 transition-colors hover:bg-white hover:text-black"
                  >
                    ←
                  </button>
                  <span className="border-x border-white/15 px-4 py-3">
                    {String(activeProof + 1).padStart(2, '0')} / {String(proofMoments.length).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    aria-label="Next proof"
                    onClick={() => setActiveProof((activeProof + 1) % proofMoments.length)}
                    className="px-4 py-3 transition-colors hover:bg-white hover:text-black"
                  >
                    →
                  </button>
                </div>
              </div>
              <figcaption aria-live="polite" className="border-t border-white/15 bg-black/95 px-5 py-5 sm:absolute sm:bottom-0 sm:left-0 sm:w-full sm:max-w-[58%] sm:border-r sm:px-8 sm:py-7">
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/60 sm:text-[10px]">
                  {proofMoment.type} / {proofMoment.label}
                </p>
                <h3 className="font-sans text-xl font-light leading-tight text-white sm:text-2xl">
                  {proofMoment.headline}
                </h3>
              </figcaption>
            </motion.figure>
          </div>
        </section>

        <footer className="flex items-center justify-center gap-5 border-t border-white/10 px-4 py-7 text-center font-mono text-[9px] uppercase tracking-widest text-white/45 sm:text-[10px]">
          <span>Astralis © 2026</span>
          <a
            href="https://www.linkedin.com/company/astralisclub"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            LinkedIn
          </a>
        </footer>
      </div>
    </main>
  )
}
