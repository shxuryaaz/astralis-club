import { Link } from 'react-router-dom'
import AstralisBackground from '../components/AstralisBackground'
import { motion } from 'motion/react'

export default function Landing() {
  return (
    <main className="relative w-full bg-black text-white selection:bg-white selection:text-black">
      <AstralisBackground />

      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* ── Hero ── */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="max-w-2xl flex flex-col items-center"
        >
          <h1 className="mb-4 font-sans text-7xl font-light tracking-[0.2em] uppercase sm:text-9xl">
            Astralis
          </h1>

          <p className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase sm:text-sm mb-14">
            Not a club. A cartel.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="flex flex-col items-center gap-5"
          >
            <Link
              to="/request"
              className="border border-white/50 text-white/80 font-mono text-[10px] tracking-[0.3em] uppercase px-14 py-3 hover:bg-white hover:text-black transition-all duration-500 w-64 text-center"
            >
              Request Access
            </Link>

            <Link
              to="/login"
              className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/25 hover:text-white/60 transition-colors duration-500"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="h-8 w-px bg-white/15" />
        </motion.div>
      </div>

      {/* ── About Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="relative z-20 max-w-3xl mx-auto px-8 py-32"
      >
        {/* Label */}
        <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/25 mb-16">
          02 // What We Are
        </p>

        {/* Statement */}
        <h2 className="font-sans font-light text-3xl sm:text-4xl text-white/90 leading-snug tracking-wide mb-12">
          A fintech collective from NIET — built to enter hackathons, and built to win them.
        </h2>

        {/* Body */}
        <p className="font-sans text-sm text-white/35 leading-loose max-w-xl mb-20">
          Astralis is not open to everyone. It is a closed group of builders, analysts, and strategists
          who operate at the intersection of financial systems and technology. We move fast,
          think in systems, and compete at the highest level — leaving before the noise starts.
        </p>

        {/* Three pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 border-t border-white/[0.07] pt-14">
          {[
            {
              index: '01',
              title: 'Fintech First',
              body: 'Payments, capital markets, lending infrastructure, and the systems that move money.',
            },
            {
              index: '02',
              title: 'Hackathon Focused',
              body: 'We select, prepare, and execute. Every competition is a coordinated operation, not a side project.',
            },
            {
              index: '03',
              title: 'Closed by Design',
              body: 'Membership is not applied for. It is extended. Quality over volume, always.',
            },
          ].map((p) => (
            <div key={p.index}>
              <p className="font-mono text-[10px] tracking-widest uppercase text-white/20 mb-3">
                {p.index}
              </p>
              <p className="font-sans text-sm text-white/70 mb-2 tracking-wide">{p.title}</p>
              <p className="font-sans text-xs text-white/30 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <div className="relative z-20 border-t border-white/[0.07] px-8 py-8 flex justify-between items-center font-mono text-[9px] tracking-widest text-white/15 uppercase">
        <span>01 // System Active</span>
        <span>2026 // Astralis</span>
      </div>
    </main>
  )
}
