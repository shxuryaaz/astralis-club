import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import AstralisLogo from './AstralisLogo'

export default function SiteLoader() {
  const { loading } = useAuth()
  const reducedMotion = useReducedMotion()
  const [minimumDone, setMinimumDone] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumDone(true), reducedMotion ? 0 : 850)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  useEffect(() => {
    if (minimumDone && !loading) setFinished(true)
  }, [loading, minimumDone])

  return (
    <AnimatePresence>
      {!finished && (
        <motion.div
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white"
        >
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35 }}
            className="flex flex-col items-center"
          >
            <AstralisLogo className="h-14 w-14" />
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.35em] text-white/65">
              Astralis
            </p>
            <div className="mt-7 h-px w-44 overflow-hidden bg-white/15">
              <motion.div
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeInOut' }}
                className="h-full origin-left bg-white/70"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
