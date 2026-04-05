import { useState, FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AstralisBackground from '../components/AstralisBackground'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'

const steps = [
  { field: 'name',     label: '01', question: "What's your name?",        placeholder: 'Full name',                     type: 'text'     },
  { field: 'email',    label: '02', question: 'Your email.',              placeholder: 'you@domain.com',                type: 'email'    },
  { field: 'reason',   label: '03', question: 'Why do you belong here?',  placeholder: 'What you build. Why Astralis.',  type: 'textarea' },
  { field: 'password', label: '04', question: 'Set a password.',          placeholder: '••••••••',                      type: 'password' },
]

export default function RequestAccess() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [values, setValues] = useState({ name: '', email: '', reason: '', password: '' })
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const step = steps[current]
  const value = values[step.field as keyof typeof values]
  const isLast = current === steps.length - 1

  function next() {
    if (!value.trim()) return
    setError('')
    if (isLast) {
      handleSubmit()
    } else {
      setDirection(1)
      setCurrent((c) => c + 1)
    }
  }

  function back() {
    if (current === 0) { navigate('/'); return }
    setDirection(-1)
    setCurrent((c) => c - 1)
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && step.type !== 'textarea') { e.preventDefault(); next() }
  }

  async function handleSubmit() {
    setSubmitting(true)

    // Create the Supabase auth account (triggers profile creation)
    const { error: authError } = await supabase.auth.signUp({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      options: { data: { name: values.name.trim() } },
    })

    if (authError) {
      const alreadyExists = authError.message?.toLowerCase().includes('already registered')
        || authError.message?.toLowerCase().includes('already exists')
      setError(alreadyExists ? 'That email is already registered. Try signing in.' : 'Something went wrong. Try again.')
      setSubmitting(false)
      return
    }

    // Store reason for admin to review
    const { error: reqError } = await supabase.from('access_requests').insert({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      reason: values.reason.trim(),
    })

    if (reqError) {
      setError('Account created, but we could not submit your request. Please contact us directly.')
      setSubmitting(false)
      return
    }

    setDone(true)
  }

  const variants = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 30 : -30 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -30 : 30 }),
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center overflow-hidden px-6 md:px-8">
      <AstralisBackground />
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }}
      />

      <div className="relative z-20 w-full max-w-sm">
        <AnimatePresence mode="wait" custom={direction}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center space-y-5"
            >
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/40">Received</p>
              <p className="font-sans font-light text-2xl text-white tracking-wide">We'll be in touch.</p>
              <p className="font-sans text-sm text-white/40 leading-relaxed">
                If selected, you'll hear from us at {values.email}.
              </p>
              <div className="pt-6">
                <Link to="/" className="font-mono text-[9px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors duration-500">
                  Return
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/30 mb-10">
                {step.label} / {steps.length.toString().padStart(2, '0')}
              </p>

              <h2 className="font-sans font-light text-xl md:text-2xl text-white tracking-wide mb-10">
                {step.question}
              </h2>

              {step.type === 'textarea' ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={value}
                  onChange={(e) => setValues((v) => ({ ...v, [step.field]: e.target.value.slice(0, 300) }))}
                  placeholder={step.placeholder}
                  className="w-full bg-transparent border-b border-white/25 text-white font-mono text-sm py-3 outline-none focus:border-white/60 transition-colors duration-500 placeholder-white/25 resize-none"
                />
              ) : (
                <input
                  autoFocus
                  type={step.type}
                  value={value}
                  onChange={(e) => setValues((v) => ({ ...v, [step.field]: e.target.value }))}
                  onKeyDown={handleKey}
                  placeholder={step.placeholder}
                  className="w-full bg-transparent border-b border-white/25 text-white font-mono text-sm py-3 outline-none focus:border-white/60 transition-colors duration-500 placeholder-white/25"
                />
              )}

              {step.type === 'textarea' && (
                <p className="font-mono text-[9px] text-white/20 text-right mt-1">{300 - value.length}</p>
              )}

              {error && <p className="font-mono text-[10px] tracking-wider text-white/40 mt-4">{error}</p>}

              <div className="flex items-center justify-between mt-12">
                <button
                  onClick={back}
                  className="font-mono text-[9px] tracking-widest uppercase text-white/25 hover:text-white/55 transition-colors duration-500 py-2"
                >
                  Back
                </button>

                <button
                  onClick={next}
                  disabled={!value.trim() || submitting}
                  className="text-white/50 hover:text-white transition-colors duration-500 disabled:opacity-20 disabled:cursor-not-allowed text-2xl py-2 px-2"
                >
                  {submitting ? '...' : '→'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
