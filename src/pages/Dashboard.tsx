import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Hackathon } from '../types'

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('hackathons')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError('Events could not be loaded. Refresh to try again.')
        else if (data) setHackathons(data as Hackathon[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_260px]">
          <main>
            <div className="mb-14">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/55">Today</p>
              <h1 className="mt-4 font-display text-4xl tracking-[-0.035em] text-[#d8d8d8]">
                Good to see you{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}.
              </h1>
              <p className="mt-3 max-w-lg font-sans text-sm leading-6 text-white/42">
                The useful things happening across Astralis, without the noise.
              </p>
            </div>

            <section>
              <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-4">
                <h2 className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/42">Upcoming sessions</h2>
                <span className="font-mono text-[9px] text-white/25">{hackathons.length}</span>
              </div>

              {loading ? (
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/32">Loading</p>
              ) : error ? (
                <p className="font-sans text-sm text-white/55">{error}</p>
              ) : hackathons.length === 0 ? (
                <div className="border border-dashed border-white/10 px-6 py-12">
                  <p className="font-display text-xl text-white/70">No sessions scheduled.</p>
                  <p className="mt-2 font-sans text-sm text-white/35">The room is still open. Start a conversation or ask for help.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.08]">
                  {hackathons.map((h) => (
                    <article key={h.id} className="grid gap-5 py-7 sm:grid-cols-[130px_1fr]">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">{formatDate(h.date)}</p>
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/28">{h.mode}</p>
                      </div>
                      <div>
                        <h3 className="font-display text-xl text-white/82">{h.title}</h3>
                        <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-white/42">{h.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-8">
            <div className="border border-white/[0.09] p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Commons room</p>
              <p className="mt-5 font-display text-xl text-white/78">Ask early. Share unfinished work.</p>
              <p className="mt-3 font-sans text-xs leading-5 text-white/38">
                One shared room while the network is small. More rooms should exist only when the work demands them.
              </p>
              <Link
                to="/chat"
                className="mt-6 inline-block border-b border-white/40 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/62"
              >
                Open commons
              </Link>
            </div>

            <div className="border-t border-white/[0.08] pt-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Working agreement</p>
              <p className="mt-4 font-sans text-xs leading-5 text-white/38">
                Be specific. Protect confidence. Give more useful context than you consume.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
