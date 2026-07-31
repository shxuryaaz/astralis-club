import { useState, KeyboardEvent } from 'react'
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

const steps = [
  { field: 'name', label: 'Identity', question: "What's your name?", hint: 'The name people know you by.', placeholder: 'Full name', type: 'text' },
  { field: 'email', label: 'Contact', question: 'Where can we reach you?', hint: 'One address. No mailing list.', placeholder: 'you@domain.com', type: 'email' },
  { field: 'work', label: 'Work', question: 'Show us how you think.', hint: 'Link one thing you made and tell us why it matters.', placeholder: 'https://… — what it is, what you did, what changed.', type: 'textarea' },
  { field: 'agency', label: 'Agency', question: 'What did nobody ask you to do?', hint: 'A thing you built, fixed, organized, or started on your own.', placeholder: 'I noticed… so I…', type: 'textarea' },
  { field: 'focus', label: 'Obsession', question: 'What keeps pulling you back?', hint: 'A problem, field, or question you cannot leave alone.', placeholder: 'Right now I am trying to understand…', type: 'textarea' },
  { field: 'contribution', label: 'Contribution', question: 'What can the room ask of you?', hint: 'Be specific about the judgment, skill, or perspective you bring.', placeholder: 'Come to me when you need…', type: 'textarea' },
  { field: 'password', label: 'Access', question: 'Set a password.', hint: 'At least eight characters. Or continue with Google.', placeholder: '••••••••', type: 'password' },
] as const

type Values = Record<(typeof steps)[number]['field'], string>

export default function RequestAccess() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [current, setCurrent] = useState(0)
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    work: '',
    agency: '',
    focus: '',
    contribution: '',
    password: '',
  })
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const step = steps[current]
  const value = values[step.field]
  const isLast = current === steps.length - 1
  const isValid = value.trim().length > 0 && (step.field !== 'password' || value.length >= 8)
  const duplicateAccountError = error === 'That email already has an account. Sign in instead.'

  function applicationReason() {
    return [
      `WORK\n${values.work.trim()}`,
      `AGENCY\n${values.agency.trim()}`,
      `OBSESSION\n${values.focus.trim()}`,
      `CONTRIBUTION\n${values.contribution.trim()}`,
    ].join('\n\n')
  }

  async function next() {
    if (!isValid || checkingEmail) return
    setError('')

    if (step.field === 'email') {
      setCheckingEmail(true)
      const { data: accountExists, error: checkError } = await supabase.rpc('email_has_account', {
        candidate_email: value.trim(),
      })
      setCheckingEmail(false)

      if (checkError) {
        setError('Could not check that email. Try again.')
        return
      }
      if (accountExists) {
        setError('That email already has an account. Sign in instead.')
        return
      }
    }

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
      reason: applicationReason(),
    }))
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      sessionStorage.removeItem('astralis_pending_request')
      setError(error.message)
      setGoogleBusy(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)

    // Create the Supabase auth account (triggers profile creation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
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

    if (authData.user?.identities?.length === 0) {
      setError('That email already has an account. Sign in instead.')
      setSubmitting(false)
      return
    }

    // Store reason for admin to review
    const { error: reqError } = await supabase.from('access_requests').insert({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      reason: applicationReason(),
    })

    if (reqError) {
      setError('Account created, but we could not submit your request. Please contact us directly.')
      setSubmitting(false)
      return
    }

    void capturePostHog('access_request_submitted', { signup_method: 'email' })
    setDone(true)
  }

  const variants = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 30 : -30 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -30 : 30 }),
  }

  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-black px-5 py-24 text-white sm:px-6 md:px-8">
      <AstralisBackground />

      <Link to="/" aria-label="Astralis home" className="absolute left-6 top-7 z-20 md:left-10">
        <AstralisLogo className="h-10 w-10" />
      </Link>

      <AnimatePresence>
        {duplicateAccountError && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            role="alert"
            className="fixed inset-x-4 top-5 z-30 ml-auto flex max-w-md items-center gap-4 border border-white bg-[#e8e8e8] px-4 py-4 text-[#1b1b1b] shadow-2xl sm:left-auto sm:right-6 sm:top-6"
          >
            <p className="flex-1 font-mono text-[10px] leading-5">
              That email already has an account.
            </p>
            <Link to="/login" className="font-mono text-[9px] uppercase tracking-[0.14em] hover:opacity-60">
              Sign in
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setError('')}
              className="px-1 opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                We review applications weekly. If there is a fit, you will hear from us at {values.email}.
              </p>
              <div className="pt-6">
                <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white">
                  Return home
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
                  onChange={(e) => setValues((v) => ({ ...v, [step.field]: e.target.value }))}
                  onKeyDown={handleKey}
                  placeholder={step.placeholder}
                  autoComplete={step.field === 'email' ? 'email' : step.field === 'password' ? 'new-password' : 'name'}
                  className="w-full border-b border-white/15 bg-transparent py-3 font-sans text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
                />
              )}

              {step.type === 'textarea' && (
                <p className="mt-2 text-right font-mono text-[9px] text-white/25">{500 - value.length}</p>
              )}

              {step.field === 'email' && (
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                  Already registered?{' '}
                  <Link to="/login" className="text-white/65 hover:text-white">Sign in</Link>
                </p>
              )}

              {error && !duplicateAccountError && <p className="mt-4 font-mono text-[10px] leading-5 text-white/55">{error}</p>}

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
                  disabled={!isValid || submitting || googleBusy || checkingEmail}
                  className="border border-white/15 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/62 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                >
                  {checkingEmail ? 'Checking' : submitting ? 'Sending' : isLast ? 'Submit application' : 'Continue'}
                </button>
              </div>

              {isLast && (
                <div className="mt-8 flex items-center justify-end gap-4 border-t border-white/[0.07] pt-6">
                  <span className="font-mono text-[9px] text-white/25">or</span>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={googleBusy || submitting}
                    className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
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
