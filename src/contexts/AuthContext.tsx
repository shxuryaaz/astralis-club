import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('fetchProfile error:', error.message, error.code)
        return null
      }
      return data as UserProfile
    } catch (e) {
      console.error('fetchProfile exception:', e)
      return null
    }
  }

  async function refetchProfile() {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  useEffect(() => {
    let mounted = true

    // Applies a session to state — fetches profile if user exists.
    // Used by both getSession() (initial load) and onAuthStateChange (subsequent events).
    async function applySession(s: Session | null) {
      if (!mounted) return
      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        const p = await fetchProfile(s.user.id)
        if (!mounted) return
        setProfile(p)
      } else {
        setProfile(null)
      }

      if (mounted) setLoading(false)
    }

    // STEP 1: Read the stored session immediately (fast, synchronous-ish).
    // This handles page reloads where the user is already signed in.
    supabase.auth.getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => { if (mounted) setLoading(false) })

    // STEP 2: Listen for future auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
    // Skip INITIAL_SESSION — it duplicates what getSession() already handles.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (!mounted) return
      setLoading(true)  // show loader while we fetch the new profile
      applySession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('signOut error:', e)
    }
    // Always clear state, even if the Supabase call failed
    setUser(null)
    setProfile(null)
    setSession(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
