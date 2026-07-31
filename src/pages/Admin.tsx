import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { capturePostHog } from '../lib/posthog'
import type { Hackathon, UserProfile, AccessRequest } from '../types'

type QueueRequest = AccessRequest & { accountOnly?: boolean }

type HackathonForm = {
  title: string
  date: string
  mode: 'online' | 'offline'
  description: string
}

const emptyForm: HackathonForm = { title: '', date: '', mode: 'online', description: '' }

function formatTimestamp(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const inputClass =
  'w-full bg-transparent border-b border-white/15 text-white font-mono text-sm py-2 outline-none focus:border-white/45 transition-colors duration-500 placeholder-white/42'
const labelClass = 'font-mono text-[10px] tracking-widest uppercase text-white/55 block mb-2'

export default function Admin() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [requests, setRequests] = useState<QueueRequest[]>([])
  const [form, setForm] = useState<HackathonForm>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hackathons' | 'users' | 'requests'>('requests')
  const [loading, setLoading] = useState(true)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)
  const [hackathonError, setHackathonError] = useState('')
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null)

  const normEmail = (e: string) => e.trim().toLowerCase()

  function profileForRequestEmail(email: string) {
    const n = normEmail(email)
    return users.find((u) => normEmail(u.email) === n)
  }

  type RequestLinkStatus = 'no_profile' | 'pending' | 'approved'

  function requestLinkStatus(req: QueueRequest): RequestLinkStatus {
    const p = profileForRequestEmail(req.email)
    if (!p) return 'no_profile'
    if (p.approved) return 'approved'
    return 'pending'
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
    if (userRes.data && reqRes.data) {
      const nextUsers = userRes.data as UserProfile[]
      const savedRequests = reqRes.data as AccessRequest[]
      const requestedEmails = new Set(savedRequests.map((request) => normEmail(request.email)))
      const accountOnlyRequests: QueueRequest[] = nextUsers
        .filter(
          (profile) =>
            profile.role === 'member' &&
            !profile.approved &&
            !requestedEmails.has(normEmail(profile.email)),
        )
        .map((profile) => ({
          id: `profile:${profile.id}`,
          name: profile.name,
          email: profile.email,
          reason: 'Account created directly without submitting the request form.',
          created_at: profile.created_at,
          accountOnly: true,
        }))

      setUsers(nextUsers)
      setRequests(
        [...savedRequests, ...accountOnlyRequests].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      )
    }
    setLoading(false)
  }

  async function handleHackathonSubmit(e: FormEvent) {
    e.preventDefault()
    setHackathonError('')
    if (editing) {
      const { error } = await supabase.from('hackathons').update(form).eq('id', editing)
      if (error) { setHackathonError(error.message); return }
      setEditing(null)
    } else {
      const { error } = await supabase.from('hackathons').insert(form)
      if (error) { setHackathonError(error.message); return }
    }
    setForm(emptyForm)
    fetchAll()
  }

  async function handleDelete(id: string) {
    setHackathonError('')
    const { error } = await supabase.from('hackathons').delete().eq('id', id)
    if (error) { setHackathonError(error.message); return }
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
    const { error } = await supabase.from('profiles').update(updated).eq('id', u.id)
    if (error) { setRowError({ id: u.id, message: error.message }); return }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)))
  }

  async function approveRequest(req: QueueRequest) {
    setRowError(null)
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
      setRowError({ id: req.id, message: error.message })
      setBusyRequestId(null)
      return
    }
    if (!data?.length) {
      setRowError({
        id: req.id,
        message:
          'No row in Members (profiles) for this email — signup may have failed or the email differs. Dismiss clears this application only; fix the account in Supabase if needed.',
      })
      setBusyRequestId(null)
      return
    }

    setUsers((prev) =>
      prev.map((u) => (normEmail(u.email) === normEmail(req.email) ? { ...u, approved: true } : u))
    )
    if (!req.accountOnly) {
      await supabase.from('access_requests').delete().eq('id', req.id)
    }
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    await fetchAll()
    void capturePostHog('access_request_approved')
    setBusyRequestId(null)
  }

  async function dismissRequest(req: QueueRequest) {
    setRowError(null)
    setBusyRequestId(req.id)
    const { error } = await supabase.from('access_requests').delete().eq('id', req.id)
    if (error) {
      setRowError({ id: req.id, message: error.message })
      setBusyRequestId(null)
      return
    }
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    setBusyRequestId(null)
  }

  async function clearApprovedFromQueue() {
    const ids = requests.filter((r) => requestLinkStatus(r) === 'approved').map((r) => r.id)
    if (ids.length === 0) return
    setRowError(null)
    setBusyRequestId('__bulk__')
    for (const id of ids) {
      const { error } = await supabase.from('access_requests').delete().eq('id', id)
      if (error) {
        setRowError({ id, message: error.message })
        setBusyRequestId(null)
        await fetchAll()
        return
      }
    }
    setRequests((prev) => prev.filter((r) => !ids.includes(r.id)))
    await fetchAll()
    setBusyRequestId(null)
  }

  async function toggleRole(u: UserProfile) {
    const updated = { role: u.role === 'admin' ? ('member' as const) : ('admin' as const) }
    const { error } = await supabase.from('profiles').update(updated).eq('id', u.id)
    if (error) { setRowError({ id: u.id, message: error.message }); return }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)))
  }

  const approvedInQueueCount = requests.filter((r) => requestLinkStatus(r) === 'approved').length
  const bulkBusy = busyRequestId === '__bulk__'

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-12">
          <h1 className="font-mono text-[10px] tracking-widest uppercase text-white/55">Admin</h1>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex gap-5 overflow-x-auto border-b border-white/[0.07] pb-4 sm:mb-12 sm:gap-8">
          {(['requests', 'users', 'hackathons'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-[10px] tracking-widest uppercase transition-colors duration-500 ${
                activeTab === tab ? 'text-white/70' : 'text-white/48 hover:text-white/78'
              }`}
            >
              {tab}
              {tab === 'requests' && requests.length > 0 && (
                <span className="ml-2 text-white/55">({requests.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/42">Loading</p>
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
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
                    className="font-mono text-[10px] tracking-widest uppercase text-white/78 border border-white/15 px-6 py-2 hover:border-white/40 hover:text-white/80 transition-all duration-500"
                  >
                    {editing ? 'Update' : 'Add'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="font-mono text-[10px] tracking-widest uppercase text-white/42 hover:text-white/78 transition-colors duration-500"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {hackathonError && (
                  <p className="mt-4 font-mono text-[10px] leading-relaxed text-white/55">{hackathonError}</p>
                )}
              </form>
            </div>

            {/* Hackathon list */}
            {hackathons.length > 0 && (
              <div>
                <p className={labelClass}>Events</p>
                <div className="mt-6 divide-y divide-white/[0.07]">
                  {hackathons.map((h) => (
                    <div key={h.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <div className="min-w-0">
                        <p className="font-sans text-sm text-white/75 mb-1">{h.title}</p>
                        <p className="font-mono text-[10px] tracking-wider text-white/48 uppercase">
                          {h.date} · {h.mode}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 justify-end gap-5 pt-1">
                        <button
                          onClick={() => handleEdit(h)}
                          className="font-mono text-[10px] tracking-widest uppercase text-white/55 hover:text-white/60 transition-colors duration-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="font-mono text-[10px] tracking-widest uppercase text-white/42 hover:text-white/78 transition-colors duration-500"
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
          /* Requests tab — submitted applications plus pending accounts created directly through sign-in */
          <div>
            <p className={labelClass}>Request queue</p>
            <p className="font-sans text-xs text-white/62 max-w-2xl mt-3 leading-relaxed">
              Submitted applications and pending accounts created directly through sign-in appear here. Approving
              grants access and removes the item from the queue.
            </p>
            {requests.length > 0 && approvedInQueueCount > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => clearApprovedFromQueue()}
                  className="font-mono text-[10px] tracking-widest uppercase text-white/68 border border-white/15 px-4 py-2 hover:border-white/35 hover:text-white/70 transition-all duration-500 disabled:opacity-25"
                >
                  {bulkBusy ? 'Clearing…' : `Clear ${approvedInQueueCount} already-approved from queue`}
                </button>
              </div>
            )}
            {requests.length === 0 ? (
              <p className="font-mono text-[10px] tracking-widest uppercase text-white/42 mt-6">Queue is empty</p>
            ) : (
              <div className="mt-8 divide-y divide-white/[0.07]">
                {requests.map((req) => {
                  const link = requestLinkStatus(req)
                  const busy = busyRequestId === req.id || bulkBusy
                  return (
                    <div key={req.id} className="py-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-sm text-white/75 mb-1">{req.name}</p>
                          <p className="font-mono text-[10px] tracking-wider text-white/48 mb-2">{req.email}</p>
                          <p className="font-mono text-[10px] tracking-wider uppercase mb-2 text-white/48">
                            {req.accountOnly
                              ? 'Pending account · no application submitted'
                              : link === 'no_profile'
                                ? 'No member profile for this email'
                                : link === 'pending'
                                  ? 'Linked · access not approved yet'
                                  : 'Already approved in Members — dismiss to remove from queue'}
                          </p>
                          <p className="font-sans text-xs text-white/68 leading-relaxed max-w-md">{req.reason}</p>
                          <p className="font-mono text-[10px] tracking-wider text-white/35 mt-2">
                            {formatTimestamp(req.created_at)}
                          </p>
                          {rowError?.id === req.id && (
                            <p className="mt-3 max-w-md font-mono text-[10px] leading-relaxed text-white/55">
                              {rowError.message}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 justify-end gap-5 pt-1">
                          {link === 'pending' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => approveRequest(req)}
                              className="font-mono text-[10px] tracking-widest uppercase text-white/55 hover:text-white/70 transition-colors duration-500 disabled:opacity-25 disabled:pointer-events-none"
                            >
                              {busy && busyRequestId === req.id ? '…' : 'Approve'}
                            </button>
                          )}
                          {!req.accountOnly && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => dismissRequest(req)}
                              className="font-mono text-[10px] tracking-widest uppercase text-white/32 hover:text-white/68 transition-colors duration-500 disabled:opacity-25 disabled:pointer-events-none"
                            >
                              Dismiss
                            </button>
                          )}
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
                <div key={u.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-white/75 mb-1">{u.name}</p>
                    <p className="font-mono text-[10px] tracking-wider text-white/48 mb-2">
                      {u.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] tracking-widest uppercase ${
                          u.approved ? 'text-white/78' : 'text-white/42'
                        }`}
                      >
                        {u.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className="font-mono text-[10px] text-white/32">·</span>
                      <span className="font-mono text-[10px] tracking-widest uppercase text-white/55">
                        {u.role}
                      </span>
                    </div>
                    {rowError?.id === u.id && (
                      <p className="mt-2 max-w-sm font-mono text-[10px] leading-relaxed text-white/55">{rowError.message}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 justify-end gap-5 pt-1">
                    <button
                      onClick={() => toggleApproval(u)}
                      className="font-mono text-[10px] tracking-widest uppercase text-white/55 hover:text-white/60 transition-colors duration-500"
                    >
                      {u.approved ? 'Revoke' : 'Approve'}
                    </button>
                    <button
                      onClick={() => toggleRole(u)}
                      className="font-mono text-[10px] tracking-widest uppercase text-white/42 hover:text-white/78 transition-colors duration-500"
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
