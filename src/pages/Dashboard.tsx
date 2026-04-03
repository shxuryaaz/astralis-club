import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Hackathon } from '../types'

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export default function Dashboard() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [interested, setInterested] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase
      .from('hackathons')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setHackathons(data as Hackathon[])
        setLoading(false)
      })
  }, [])

  function toggleInterested(id: string) {
    setInterested((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-8 py-16">
        <div className="mb-16">
          <h1 className="font-mono text-[10px] tracking-widest uppercase text-white/30">
            Feed
          </h1>
        </div>

        {loading ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/20">
            Loading
          </p>
        ) : hackathons.length === 0 ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/20">
            No events
          </p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {hackathons.map((h) => (
              <div key={h.id} className="py-10">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-white/30">
                        {formatDate(h.date)}
                      </span>
                      <span className="font-mono text-[10px] text-white/15">·</span>
                      <span className="font-mono text-[10px] tracking-widest uppercase text-white/25">
                        {h.mode}
                      </span>
                    </div>
                    <h2 className="font-sans font-light text-lg text-white/90 tracking-wide mb-3">
                      {h.title}
                    </h2>
                    <p className="font-sans text-sm text-white/35 leading-relaxed max-w-md">
                      {h.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end gap-3 pt-7">
                    <button className="font-mono text-[10px] tracking-widest uppercase text-white/40 border border-white/[0.12] px-5 py-2 hover:border-white/30 hover:text-white/70 transition-all duration-500">
                      Enter
                    </button>
                    <button
                      onClick={() => toggleInterested(h.id)}
                      className={`font-mono text-[10px] tracking-widest uppercase transition-colors duration-500 ${
                        interested.has(h.id)
                          ? 'text-white/55'
                          : 'text-white/20 hover:text-white/40'
                      }`}
                    >
                      {interested.has(h.id) ? 'Interested' : 'Mark Interested'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
