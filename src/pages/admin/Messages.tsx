import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Badge } from '../../components/status/StatusBadge'
import { Send, MessageCircle, Search, ShieldCheck } from 'lucide-react'

type Conv = {
  userA: { id: string; Name: string; role: string | null }
  userB: { id: string; Name: string; role: string | null }
  lastMessage: { text: string; createdAt: string; fromId: string }
  totalMessages: number
  unread: number
}

const roleBadge = (r: string | null) =>
  r === 'customer' ? 'brand' :
  r === 'salesperson' ? 'success' :
  r === 'manager' ? 'info' :
  r === 'admin' ? 'warning' : 'default'

const timeAgo = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const AdminMessages = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [active, setActive] = useState<Conv | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['adminConversations'],
    queryFn: async () => messagesApi.listAllConversations(),
    refetchInterval: 15_000,
  })

  const conversations: Conv[] = convData?.conversations || []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) =>
      c.userA.Name.toLowerCase().includes(q) ||
      c.userB.Name.toLowerCase().includes(q) ||
      c.lastMessage.text.toLowerCase().includes(q)
    )
  }, [conversations, query])

  useEffect(() => {
    if (!active && filtered.length > 0) setActive(filtered[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['adminThread', active?.userA.id, active?.userB.id],
    queryFn: async () => messagesApi.getAnyThread(active!.userA.id, active!.userB.id),
    enabled: !!active,
    refetchInterval: 8_000,
  })

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [threadData?.messages?.length])

  // Customer is one side of the thread — that's who admin can reply to.
  const customerParty = useMemo(() => {
    if (!active) return null
    if (active.userA.role === 'customer') return active.userA
    if (active.userB.role === 'customer') return active.userB
    return null
  }, [active])

  const send = useMutation({
    mutationFn: (text: string) => messagesApi.send(customerParty!.id, text),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['adminThread', active?.userA.id, active?.userB.id] })
      queryClient.invalidateQueries({ queryKey: ['adminConversations'] })
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to send.'),
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    send.mutate(t)
  }

  if (convLoading) return <LoadingState message="Loading conversations…" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Messages · admin oversight</h1>
          <p className="text-xs text-gray-500 mt-1">Every customer ↔ salesperson conversation across the business. You can read all threads and reply as admin.</p>
        </div>
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or message…"
            className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardBody className="p-0">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {filtered.length} conversation{filtered.length === 1 ? '' : 's'}
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No conversations yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                {filtered.map((c) => {
                  const isActive = active && c.userA.id === active.userA.id && c.userB.id === active.userB.id
                  return (
                    <li
                      key={`${c.userA.id}-${c.userB.id}`}
                      onClick={() => setActive(c)}
                      className={`p-3 cursor-pointer hover:bg-surface-50 ${isActive ? 'bg-brand-50/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {c.userA.Name} <span className="text-gray-400">·</span> {c.userB.Name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <Badge variant={roleBadge(c.userA.role) as any}>{c.userA.role || '?'}</Badge>
                            <Badge variant={roleBadge(c.userB.role) as any}>{c.userB.role || '?'}</Badge>
                          </div>
                        </div>
                        {c.unread > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-600 text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{c.lastMessage.text}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(c.lastMessage.createdAt)} · {c.totalMessages} messages</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Thread viewer */}
        <Card className="lg:col-span-2">
          <CardBody className="p-0">
            {!active ? (
              <div className="text-center py-20">
                <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Select a conversation to read it.</p>
              </div>
            ) : (
              <div className="flex flex-col h-[70vh]">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {active.userA.Name} ↔ {active.userB.Name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {active.totalMessages} messages · {active.unread} unread
                    </p>
                  </div>
                </div>

                <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-50">
                  {threadLoading ? (
                    <p className="text-sm text-gray-400 text-center">Loading…</p>
                  ) : (threadData?.messages || []).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center">No messages.</p>
                  ) : (
                    (threadData?.messages || []).map((m: any) => {
                      const fromA = m.from === active.userA.id
                      const author = fromA ? active.userA : active.userB
                      const isAdmin = author.role === 'admin'
                      return (
                        <div key={m.id} className={`flex ${fromA ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isAdmin ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                            fromA ? 'bg-white border border-gray-200 text-gray-900' :
                            'bg-brand-600 text-white'
                          }`}>
                            <p className="text-[11px] opacity-70 mb-0.5 flex items-center gap-1">
                              {isAdmin && <ShieldCheck className="h-3 w-3" />}
                              <span className="font-semibold">{author.Name}</span> · <span className="capitalize">{author.role || '?'}</span> · {new Date(m.createdAt).toLocaleString()}
                            </p>
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {customerParty ? (
                  <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Reply as admin
                    </div>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Reply to ${customerParty.Name}…`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100"
                    />
                    <button
                      type="submit"
                      disabled={send.isPending || !draft.trim()}
                      className="h-10 w-10 rounded-full gradient-brand text-white grid place-items-center disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-center">
                    Reply is only available for conversations that include a customer. (This conversation is between {active.userA.role} and {active.userB.role}.)
                  </div>
                )}

                {send.isPending && (
                  <p className="text-[11px] text-gray-500 px-3 pb-2">Sending as {user?.Name}…</p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
