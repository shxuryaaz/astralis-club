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
      <section className="relative z-20 py-24 md:py-40">

        {/* Label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-5xl mx-auto px-4 md:px-8 mb-16 md:mb-20"
        >
          <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/25">
            02 // What We Are
          </p>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="max-w-5xl mx-auto px-4 md:px-8 mb-16 md:mb-24"
        >
          <h2 className="font-sans font-light text-4xl sm:text-5xl md:text-[3.75rem] leading-[1.15] tracking-wide">
            <span className="text-white/90">NIET's premier</span>
            <br />
            <span className="text-white/40">quant &amp; fintech</span>
            <br />
            <span className="text-white/90">collective.</span>
          </h2>
        </motion.div>

        {/* Descriptor */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-5xl mx-auto px-4 md:px-8 mb-20 md:mb-28"
        >
          <p className="font-sans text-sm text-white/30 leading-loose max-w-md">
            We model markets, build systems, and dominate hackathons.
            Closed by design. Selected by merit.
          </p>
        </motion.div>

        {/* Pillars — horizontal rows */}
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {[
            {
              index: '01',
              title: 'Quant & Finance',
              body: 'Algorithmic thinking, financial modelling, market systems, and the mathematics that moves capital.',
            },
            {
              index: '02',
              title: 'Fintech & Engineering',
              body: 'Payments infrastructure, lending systems, capital markets tech — where finance meets code.',
            },
            {
              index: '03',
              title: 'Hackathon Dominance',
              body: "We don't participate. We arrive prepared, execute as a unit, and leave with the win.",
            },
          ].map((p, i) => (
            <motion.div
              key={p.index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: 'easeOut' }}
              className="flex items-start gap-6 md:gap-12 py-7 md:py-9 border-t border-white/[0.07]"
            >
              <span className="font-mono text-[10px] tracking-widest text-white/20 mt-[3px] w-5 flex-shrink-0">
                {p.index}
              </span>
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-12 flex-1 min-w-0">
                <p className="font-sans text-sm text-white/65 tracking-wide mb-2 sm:mb-0 sm:w-44 flex-shrink-0">
                  {p.title}
                </p>
                <p className="font-sans text-sm text-white/28 leading-relaxed flex-1">
                  {p.body}
                </p>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-white/[0.07]" />
        </div>

      </section>

      {/* ── Footer ── */}
      <div className="relative z-20 border-t border-white/[0.07] px-8 py-8 flex justify-between items-center font-mono text-[9px] tracking-widest text-white/15 uppercase">
        <span>01 // System Active</span>
        <span>2026 // Astralis</span>
      </div>
    </main>
  )
}
