import { useEffect, useState, KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AstralisBackground from '../components/AstralisBackground'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'
import { capturePostHog } from '../lib/posthog'
import AstralisLogo from '../components/AstralisLogo'
import { useAuth } from '../contexts/AuthContext'

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

type Values = {
  links: string
  flex: string
  building: string
  contribution: string
}

type Field = keyof Values

type Step = {
  field: Field
  label: string
  question: string
  hint: string
  placeholder: string
  type: 'text' | 'textarea'
  maxLength?: number
}

const steps: Step[] = [
  {
    field: 'links',
    label: 'Links',
    question: 'Links. LinkedIn, GitHub, portfolio, whatever shows your work.',
    hint: 'One per line. Put the strongest link first.',
    placeholder: 'https://…',
    type: 'textarea',
  },
  {
    field: 'flex',
    label: 'Flex',
    question: "What's your biggest flex?",
    hint: "One thing you're proud of. Product, funding, audience, collab, side project.",
    placeholder: "The one thing you're proudest of.",
    type: 'textarea',
  },
  {
    field: 'building',
    label: 'Now',
    question: 'What are you building right now?',
    hint: "Present tense. 'Planning to' doesn't count.",
    placeholder: 'Right now I am building…',
    type: 'textarea',
  },
  { field: 'contribution', label: 'Contribution', question: 'What can the room ask of you?', hint: 'Be specific about the judgment, skill, or perspective you bring.', placeholder: 'Come to me when you need…', type: 'textarea' },
]

const basedStorageKey = 'astralis_application_based'

export default function RequestAccess() {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const [current, setCurrent] = useState(0)
  const [values, setValues] = useState<Values>({
    links: '',
    flex: '',
    building: '',
    contribution: '',
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [based, setBased] = useState(() =>
    typeof window === 'undefined' ? '' : window.localStorage.getItem(basedStorageKey) || '',
  )
  const [authStage, setAuthStage] = useState<'details' | 'sent'>('details')
  const [resendIn, setResendIn] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [otpBusy, setOtpBusy] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const step = steps[current]
  const value = values[step.field]
  const isLast = current === steps.length - 1
  const isValid =
    step.field === 'links'
      ? /https?:\/\/\S+/i.test(values.links.trim())
      : value.trim().length > 0

  useEffect(() => {
    if (!user) return
    setName(profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '')
    setEmail(user.email || '')
    setBased(user.user_metadata?.based || window.localStorage.getItem(basedStorageKey) || '')
    setCurrent(0)
  }, [profile?.name, user])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setInterval(() => {
      setResendIn((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setCheckingApplication(true)

    supabase
      .from('access_requests')
      .select('id')
      .eq('user_id', user.id)
      .is('approved_at', null)
      .limit(1)
      .maybeSingle()
      .then(({ data, error: requestError }) => {
        if (cancelled) return
        if (requestError) console.error('application check:', requestError.message)
        if (data) setDone(true)
        setCheckingApplication(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  function applicationReason() {
    return [
      `BASED IN\n${based.trim()}`,
      `LINKS\n${values.links.trim()}`,
      `BIGGEST FLEX\n${values.flex.trim()}`,
      `BUILDING NOW\n${values.building.trim()}`,
      `CONTRIBUTION\n${values.contribution.trim()}`,
    ].join('\n\n')
  }

  async function next() {
    if (!isValid) return
    setError('')

    if (isLast) {
      void handleSubmit()
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

  function otpErrorMessage(message?: string) {
    const normalized = message?.toLowerCase() || ''
    if (normalized.includes('rate') || normalized.includes('too many') || normalized.includes('security purposes')) {
      return 'Too many verification requests. Wait a few minutes before trying again.'
    }
    if (normalized.includes('expired') || normalized.includes('invalid')) {
      return 'That verification link is invalid or expired. Request a new one.'
    }
    return 'We could not complete email verification. Try again shortly.'
  }

  async function sendOtp() {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedBased = based.trim()
    if (!name.trim() || !normalizedBased || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || otpBusy || resendIn > 0) return

    setError('')
    setOtpBusy(true)
    window.localStorage.setItem(basedStorageKey, normalizedBased)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        data: { name: name.trim(), based: normalizedBased },
        emailRedirectTo: `${window.location.origin}/request`,
      },
    })
    setOtpBusy(false)

    if (otpError) {
      setError(otpErrorMessage(otpError.message))
      return
    }

    setAuthStage('sent')
    setResendIn(60)
  }

  async function handleGoogleSignup() {
    const normalizedBased = based.trim()
    if (!normalizedBased) return
    setError('')
    setGoogleBusy(true)
    window.localStorage.setItem(basedStorageKey, normalizedBased)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/request` },
    })
    if (error) {
      setError('Google sign-in could not start. Try again.')
      setGoogleBusy(false)
    }
  }

  async function handleSubmit() {
    if (!user?.id || !user.email || !based.trim()) return
    setSubmitting(true)
    const { error: reqError } = await supabase.from('access_requests').insert({
      user_id: user.id,
      name: profile?.name || user.user_metadata?.name || name || user.email.split('@')[0],
      email: user.email.trim().toLowerCase(),
      reason: applicationReason(),
    })

    if (reqError && reqError.code !== '23505') {
      setError('We could not submit your request. Please try again.')
      setSubmitting(false)
      return
    }

    if (!reqError) {
      void capturePostHog('access_request_submitted', {
        signup_method: user.app_metadata.provider === 'google' ? 'google' : 'email_otp',
      })
    }
    setDone(true)
    setSubmitting(false)
    window.localStorage.removeItem(basedStorageKey)
  }

  const variants = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 30 : -30 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -30 : 30 }),
  }

  if (!loading && user && (profile?.approved || profile?.role === 'admin')) {
    return <Navigate to="/dashboard" replace />
  }

  if (checkingApplication) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-white">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/42">Checking application</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-black px-5 py-24 text-white sm:px-6 md:px-8">
      <AstralisBackground />

      <Link to="/" aria-label="Astralis home" className="absolute left-6 top-7 z-20 md:left-10">
        <AstralisLogo className="h-10 w-10" />
      </Link>

      <div className="relative z-20 w-full max-w-xl">
        <AnimatePresence mode="wait" custom={direction}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">Application received</p>
              <p className="font-display text-4xl tracking-[-0.035em]">Your work is now in the room.</p>
              <p className="max-w-md font-sans text-sm leading-7 text-white/52">
                We review applications weekly. If there is a fit, you will hear from us at {user?.email || email}.
              </p>
              <div className="pt-6">
                <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white">
                  Return home
                </Link>
              </div>
            </motion.div>
          ) : !user ? (
            <motion.div
              key={authStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <div className="mb-12 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                  {authStage === 'details' ? 'Identity' : 'Verification sent'}
                </p>
                <p className="font-mono text-[9px] tracking-[0.12em] text-white/28">
                  {authStage === 'details' ? '01 / 02' : '02 / 02'}
                </p>
              </div>

              <h2 className="mb-3 font-display text-2xl tracking-[-0.03em] sm:text-3xl md:text-4xl">
                {authStage === 'details' ? 'Verify your email.' : 'Check your inbox.'}
              </h2>
              <p className="mb-9 max-w-md font-sans text-sm leading-6 text-white/42">
                {authStage === 'details'
                  ? 'We verify every inbox before accepting an application.'
                  : `We sent a secure sign-in link to ${email.trim().toLowerCase()}. Open it to continue your application.`}
              </p>

              {authStage === 'details' ? (
                <div className="space-y-6">
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value.slice(0, 100))}
                    placeholder="Full name"
                    autoComplete="name"
                    className="w-full border-b border-white/15 bg-transparent py-3 font-sans text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void sendOtp()
                      }
                    }}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full border-b border-white/15 bg-transparent py-3 font-sans text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
                  />
                  <input
                    type="text"
                    value={based}
                    onChange={(event) => setBased(event.target.value.slice(0, 100))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void sendOtp()
                      }
                    }}
                    placeholder="Where are you based?"
                    autoComplete="address-level2"
                    className="w-full border-b border-white/15 bg-transparent py-3 font-sans text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
                  />
                </div>
              ) : null}

              {error && <p className="mt-4 font-mono text-[10px] leading-5 text-white/55">{error}</p>}

              <div className="mt-12 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (authStage === 'sent') {
                      setAuthStage('details')
                      setError('')
                    } else {
                      navigate('/')
                    }
                  }}
                  className="py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void sendOtp()}
                  disabled={
                    otpBusy ||
                    authStage === 'sent' ||
                    !name.trim() ||
                    !based.trim() ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                  }
                  className="border border-white/15 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/62 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                >
                  {otpBusy ? 'Working' : authStage === 'details' ? 'Send link' : 'Link sent'}
                </button>
              </div>

              {authStage === 'sent' && (
                <div className="mt-8 flex items-center justify-end gap-4 border-t border-white/[0.07] pt-6">
                  <button
                    type="button"
                    onClick={() => void sendOtp()}
                    disabled={otpBusy || resendIn > 0}
                    className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend link'}
                  </button>
                </div>
              )}

              {authStage === 'details' && (
                <div className="mt-8 flex items-center justify-end gap-4 border-t border-white/[0.07] pt-6">
                  <span className="font-mono text-[9px] text-white/25">or</span>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={googleBusy || otpBusy || !based.trim()}
                    className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                  >
                    <GoogleIcon />
                    {googleBusy ? 'Redirecting…' : 'Continue with Google'}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <div className="mb-12 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">{step.label}</p>
                <p className="font-mono text-[9px] tracking-[0.12em] text-white/28">
                  {String(current + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
                </p>
              </div>

              <h2 className="mb-3 font-display text-2xl tracking-[-0.03em] sm:text-3xl md:text-4xl">
                {step.question}
              </h2>
              <p className="mb-9 max-w-md font-sans text-sm leading-6 text-white/42">{step.hint}</p>

              {step.type === 'textarea' ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={value}
                  onChange={(e) => setValues((v) => ({ ...v, [step.field]: e.target.value.slice(0, 500) }))}
                  placeholder={step.placeholder}
                  className="w-full resize-none border-b border-white/15 bg-transparent py-3 font-sans text-sm leading-6 text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
                />
              ) : (
                <input
                  autoFocus
                  type={step.type}
                  value={value}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [step.field]: step.maxLength ? e.target.value.slice(0, step.maxLength) : e.target.value,
                    }))
                  }
                  onKeyDown={handleKey}
                  placeholder={step.placeholder}
                  maxLength={step.maxLength}
                  autoComplete="off"
                  className="w-full border-b border-white/15 bg-transparent py-3 font-sans text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
                />
              )}

              {step.type === 'textarea' && (
                <p className="mt-2 text-right font-mono text-[9px] text-white/25">{500 - value.length}</p>
              )}

              {step.maxLength && (
                <p className="mt-2 text-right font-mono text-[9px] text-white/25">
                  {step.maxLength - value.length}
                </p>
              )}

              {step.field === 'links' && values.links.trim() && !isValid && (
                <p className="mt-3 font-mono text-[9px] leading-5 text-white/40">
                  Add at least one full http:// or https:// link.
                </p>
              )}

              {error && <p className="mt-4 font-mono text-[10px] leading-5 text-white/55">{error}</p>}

              <div className="mt-12 flex items-center justify-between">
                <button
                  type="button"
                  onClick={back}
                  className="py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-white"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={next}
                  disabled={!isValid || submitting}
                  className="border border-white/15 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/62 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                >
                  {submitting ? 'Sending' : isLast ? 'Submit application' : 'Continue'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
