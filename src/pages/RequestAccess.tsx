import { useState, FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AstralisBackground from '../components/AstralisBackground'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'

function GoogleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

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
  const [googleBusy, setGoogleBusy] = useState(false)
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

  async function handleGoogleSignup() {
    setError('')
    setGoogleBusy(true)
    sessionStorage.setItem('astralis_pending_request', JSON.stringify({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      reason: values.reason.trim(),
    }))
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
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
                  disabled={!value.trim() || submitting || googleBusy}
                  className="text-white/50 hover:text-white transition-colors duration-500 disabled:opacity-20 disabled:cursor-not-allowed text-2xl py-2 px-2"
                >
                  {submitting ? '...' : '→'}
                </button>
              </div>

              {isLast && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <span className="font-mono text-[10px] text-white/15 tracking-widest">or skip password</span>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={googleBusy || submitting}
                    className="font-mono text-[10px] tracking-widest uppercase text-white/25 hover:text-white/55 transition-colors duration-500 disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <GoogleIcon />
                    {googleBusy ? 'Redirecting…' : 'Continue with Google'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
