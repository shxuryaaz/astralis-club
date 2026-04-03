import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Message } from '../types'

const MAX_LENGTH = 300
const RATE_LIMIT_MS = 3000

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function Chat() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastSent, setLastSent] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) setMessages(data as Message[])
        setLoading(false)
      })

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e?: FormEvent) {
    e?.preventDefault()

    const trimmed = input.trim()
    if (!trimmed || !user || !profile) return

    const now = Date.now()
    if (now - lastSent < RATE_LIMIT_MS) return

    setInput('')
    setLastSent(now)

    await supabase.from('messages').insert({
      user_id: user.id,
      sender_name: profile.name,
      content: trimmed.slice(0, MAX_LENGTH),
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const rateLimited = Date.now() - lastSent < RATE_LIMIT_MS
  const canSend = input.trim().length > 0 && !rateLimited
  const charsLeft = MAX_LENGTH - input.length

  return (
    <div className="flex flex-col bg-black" style={{ height: 'calc(100vh - 44px)' }}>
      {/* Channel header */}
      <div className="border-b border-white/[0.07] px-8 py-5 flex-shrink-0">
        <span className="font-mono text-[10px] tracking-widest uppercase text-white/30">
          Channel
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-8 py-10 scroll-smooth">
        {loading ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/20">
            Loading
          </p>
        ) : messages.length === 0 ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/20">
            No messages
          </p>
        ) : (
          <div className="max-w-2xl space-y-7">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className="flex items-baseline gap-4 mb-1">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-white/45">
                    {msg.sender_name}
                  </span>
                  <span className="font-mono text-[10px] text-white/18">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="font-sans text-sm text-white/65 leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-white/[0.07] px-8 py-5 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-2xl flex items-center gap-6">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              className="w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-2 outline-none focus:border-white/40 transition-colors duration-500 placeholder-white/18 pr-8"
            />
            {charsLeft <= 50 && charsLeft >= 0 && (
              <span className="absolute right-0 bottom-2 font-mono text-[10px] text-white/20">
                {charsLeft}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSend}
            className="font-mono text-[10px] tracking-widest uppercase text-white/30 border border-white/[0.12] px-5 py-2 hover:border-white/30 hover:text-white/60 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
