import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Hackathon, UserProfile, AccessRequest } from '../types'

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
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [form, setForm] = useState<HackathonForm>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hackathons' | 'users' | 'requests'>('requests')
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null)

  const normEmail = (e: string) => e.trim().toLowerCase()

  function profileForRequestEmail(email: string) {
    const n = normEmail(email)
    return users.find((u) => normEmail(u.email) === n)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [hackRes, userRes, reqRes] = await Promise.all([
      supabase.from('hackathons').select('*').order('date'),
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('access_requests').select('*').order('created_at', { ascending: false }),
    ])
    if (hackRes.error) console.error('hackathons:', hackRes.error.message)
    if (userRes.error) console.error('profiles:', userRes.error.message)
    if (reqRes.error) console.error('access_requests:', reqRes.error.message)
    if (hackRes.data) setHackathons(hackRes.data as Hackathon[])
    if (userRes.data) setUsers(userRes.data as UserProfile[])
    if (reqRes.data) setRequests(reqRes.data as AccessRequest[])
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

  async function approveRequest(req: AccessRequest) {
    setRequestError('')
    setBusyRequestId(req.id)
    const match = profileForRequestEmail(req.email)
    const q = match
      ? supabase.from('profiles').update({ approved: true }).eq('id', match.id).select('id')
      : supabase
          .from('profiles')
          .update({ approved: true })
          .ilike('email', normEmail(req.email))
          .select('id')

    const { data, error } = await q

    if (error) {
      setRequestError(error.message)
      setBusyRequestId(null)
      return
    }
    if (!data?.length) {
      setRequestError(
        'No profile matches this email (case mismatch or they have not finished sign-up). Use the Users tab or check Supabase → Authentication → Users.'
      )
      setBusyRequestId(null)
      return
    }

    setUsers((prev) =>
      prev.map((u) => (normEmail(u.email) === normEmail(req.email) ? { ...u, approved: true } : u))
    )
    await supabase.from('access_requests').delete().eq('id', req.id)
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    await fetchAll()
    setBusyRequestId(null)
  }

  async function dismissRequest(req: AccessRequest) {
    setRequestError('')
    setBusyRequestId(req.id)
    const { error } = await supabase.from('access_requests').delete().eq('id', req.id)
    if (error) {
      setRequestError(error.message)
      setBusyRequestId(null)
      return
    }
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    setBusyRequestId(null)
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
          {(['requests', 'users', 'hackathons'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-[10px] tracking-widest uppercase transition-colors duration-500 ${
                activeTab === tab ? 'text-white/70' : 'text-white/25 hover:text-white/50'
              }`}
            >
              {tab}
              {tab === 'requests' && requests.length > 0 && (
                <span className="ml-2 text-white/30">({requests.length})</span>
              )}
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
        ) : activeTab === 'requests' ? (
          /* Requests tab */
          <div>
            <p className={labelClass}>Pending Requests</p>
            {requestError && (
              <p className="font-mono text-[10px] text-amber-200/80 mt-4 max-w-xl leading-relaxed">
                {requestError}
              </p>
            )}
            {requests.length === 0 ? (
              <p className="font-mono text-[10px] tracking-widest uppercase text-white/20 mt-6">No pending requests</p>
            ) : (
              <div className="mt-6 divide-y divide-white/[0.07]">
                {requests.map((req) => {
                  const profile = profileForRequestEmail(req.email)
                  const alreadyApproved = profile?.approved === true
                  const busy = busyRequestId === req.id
                  return (
                    <div key={req.id} className="py-6">
                      <div className="flex items-start justify-between gap-8">
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-sm text-white/75 mb-1">{req.name}</p>
                          <p className="font-mono text-[10px] tracking-wider text-white/25 mb-3">{req.email}</p>
                          <p className="font-sans text-xs text-white/40 leading-relaxed max-w-md">{req.reason}</p>
                          {alreadyApproved && (
                            <p className="font-mono text-[10px] tracking-widest uppercase text-white/30 mt-2">Already approved</p>
                          )}
                        </div>
                        <div className="flex gap-5 pt-1 flex-shrink-0">
                          {!alreadyApproved && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => approveRequest(req)}
                              className="font-mono text-[10px] tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors duration-500 disabled:opacity-25 disabled:pointer-events-none"
                            >
                              {busy ? '…' : 'Approve'}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => dismissRequest(req)}
                            className="font-mono text-[10px] tracking-widest uppercase text-white/15 hover:text-white/40 transition-colors duration-500 disabled:opacity-25 disabled:pointer-events-none"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
