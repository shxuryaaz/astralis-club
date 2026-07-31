import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react'
import { supabase } from '../lib/supabase'
import { capturePostHog } from '../lib/posthog'
import { useAuth } from '../contexts/AuthContext'
import type { Message } from '../types'

const MAX_LENGTH = 300
const RATE_LIMIT_MS = 3000

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function Chat() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [rateLimited, setRateLimited] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) setMessages((data as Message[]).reverse())
        setLoading(false)
      })

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !user || !profile || rateLimited) return
    setSendError('')
    setInput('')
    setRateLimited(true)
    setTimeout(() => setRateLimited(false), RATE_LIMIT_MS)
    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      sender_name: profile.name,
      content: trimmed.slice(0, MAX_LENGTH),
    })
    if (error) {
      setInput(trimmed)
      setSendError('Failed to send. Try again.')
    } else {
      void capturePostHog('chat_message_sent')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  const canSend = input.trim().length > 0 && !rateLimited
  const charsLeft = MAX_LENGTH - input.length

  return (
    <div className="flex flex-col bg-black" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 py-4 md:px-8 md:py-5">
        <span className="font-display text-lg text-white/78">Commons</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">Shared room</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
        {loading ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/42">Loading</p>
        ) : messages.length === 0 ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/42">No messages</p>
        ) : (
          <div className="max-w-2xl space-y-6 md:space-y-7">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className="flex items-baseline gap-2 md:gap-4 mb-1">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-white/72 truncate max-w-[140px] md:max-w-none">
                    {msg.sender_name}
                  </span>
                  <span className="font-mono text-[10px] text-white/42 flex-shrink-0">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="font-sans text-sm text-white/65 leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/[0.08] px-4 py-4 md:px-8 md:py-5">
        {sendError && (
          <p className="mb-3 max-w-2xl font-mono text-[10px] text-white/55">{sendError}</p>
        )}
        <form onSubmit={handleSend} className="flex max-w-2xl items-center gap-2 sm:gap-4 md:gap-6">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder="Share context, ask clearly"
              className="w-full border-b border-white/15 bg-transparent py-3 pr-8 font-sans text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60"
            />
            {charsLeft <= 50 && (
              <span className="absolute right-0 bottom-3 font-mono text-[10px] text-white/42">{charsLeft}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSend}
            className="flex-shrink-0 border border-white/[0.12] px-3 py-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/55 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 sm:px-4 sm:text-[9px] sm:tracking-[0.14em] md:px-5"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
