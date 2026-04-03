import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Hackathon, UserProfile } from '../types'

type HackathonForm = {
  title: string
  date: string
  mode: 'online' | 'offline'
  description: string
}

const emptyForm: HackathonForm = { title: '', date: '', mode: 'online', description: '' }

const inputClass =
  'w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-2 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/20'
const labelClass = 'font-mono text-[10px] tracking-widest uppercase text-white/30 block mb-2'

export default function Admin() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [form, setForm] = useState<HackathonForm>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hackathons' | 'users'>('hackathons')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [hackRes, userRes] = await Promise.all([
      supabase.from('hackathons').select('*').order('date'),
      supabase.from('profiles').select('*').order('created_at'),
    ])
    if (hackRes.data) setHackathons(hackRes.data as Hackathon[])
    if (userRes.data) setUsers(userRes.data as UserProfile[])
    setLoading(false)
  }

  async function handleHackathonSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) {
      await supabase.from('hackathons').update(form).eq('id', editing)
      setEditing(null)
    } else {
      await supabase.from('hackathons').insert(form)
    }
    setForm(emptyForm)
    fetchAll()
  }

  async function handleDelete(id: string) {
    await supabase.from('hackathons').delete().eq('id', id)
    setHackathons((prev) => prev.filter((h) => h.id !== id))
  }

  function handleEdit(h: Hackathon) {
    setEditing(h.id)
    setForm({ title: h.title, date: h.date, mode: h.mode, description: h.description })
  }

  function cancelEdit() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function toggleApproval(u: UserProfile) {
    const updated = { approved: !u.approved }
    await supabase.from('profiles').update(updated).eq('id', u.id)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)))
  }

  async function toggleRole(u: UserProfile) {
    const updated = { role: u.role === 'admin' ? ('member' as const) : ('admin' as const) }
    await supabase.from('profiles').update(updated).eq('id', u.id)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)))
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-8 py-16">
        <div className="mb-12">
          <h1 className="font-mono text-[10px] tracking-widest uppercase text-white/30">Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-12 border-b border-white/[0.07] pb-4">
          {(['hackathons', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-[10px] tracking-widest uppercase transition-colors duration-500 ${
                activeTab === tab ? 'text-white/70' : 'text-white/25 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/20">Loading</p>
        ) : activeTab === 'hackathons' ? (
          <div className="space-y-16">
            {/* Form */}
            <div>
              <p className={labelClass}>{editing ? 'Edit Event' : 'New Event'}</p>
              <form onSubmit={handleHackathonSubmit} className="space-y-6 mt-6">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="Event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Mode</label>
                    <select
                      className={`${inputClass} cursor-pointer`}
                      value={form.mode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, mode: e.target.value as 'online' | 'offline' }))
                      }
                    >
                      <option value="online" className="bg-black">
                        Online
                      </option>
                      <option value="offline" className="bg-black">
                        Offline
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                    placeholder="Short description"
                  />
                </div>
                <div className="flex gap-6 pt-2">
                  <button
                    type="submit"
                    className="font-mono text-[10px] tracking-widest uppercase text-white/50 border border-white/15 px-6 py-2 hover:border-white/40 hover:text-white/80 transition-all duration-500"
                  >
                    {editing ? 'Update' : 'Add'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="font-mono text-[10px] tracking-widest uppercase text-white/20 hover:text-white/50 transition-colors duration-500"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Hackathon list */}
            {hackathons.length > 0 && (
              <div>
                <p className={labelClass}>Events</p>
                <div className="mt-6 divide-y divide-white/[0.07]">
                  {hackathons.map((h) => (
                    <div key={h.id} className="py-6 flex items-start justify-between gap-8">
                      <div className="min-w-0">
                        <p className="font-sans text-sm text-white/75 mb-1">{h.title}</p>
                        <p className="font-mono text-[10px] tracking-wider text-white/25 uppercase">
                          {h.date} · {h.mode}
                        </p>
                      </div>
                      <div className="flex gap-5 pt-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(h)}
                          className="font-mono text-[10px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors duration-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="font-mono text-[10px] tracking-widest uppercase text-white/20 hover:text-white/50 transition-colors duration-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Users tab */
          <div>
            <p className={labelClass}>Members</p>
            <div className="mt-6 divide-y divide-white/[0.07]">
              {users.map((u) => (
                <div key={u.id} className="py-6 flex items-start justify-between gap-8">
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-white/75 mb-1">{u.name}</p>
                    <p className="font-mono text-[10px] tracking-wider text-white/25 mb-2">
                      {u.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] tracking-widest uppercase ${
                          u.approved ? 'text-white/50' : 'text-white/20'
                        }`}
                      >
                        {u.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className="font-mono text-[10px] text-white/15">·</span>
                      <span className="font-mono text-[10px] tracking-widest uppercase text-white/30">
                        {u.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-5 pt-1 flex-shrink-0">
                    <button
                      onClick={() => toggleApproval(u)}
                      className="font-mono text-[10px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors duration-500"
                    >
                      {u.approved ? 'Revoke' : 'Approve'}
                    </button>
                    <button
                      onClick={() => toggleRole(u)}
                      className="font-mono text-[10px] tracking-widest uppercase text-white/20 hover:text-white/50 transition-colors duration-500"
                    >
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
