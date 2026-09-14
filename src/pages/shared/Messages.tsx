import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { messagesApi, customersApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Send, MessageCircle, ShieldCheck } from 'lucide-react'

type ThreadItem = {
  otherUserId: string     // the party admin/sender replies TO (customer for admin oversight)
  otherName: string
  otherRole: string
  lastMessage: { text: string; createdAt: string; mine: boolean }
  unread: number
  spName?: string         // shown as sub-label for admin (customer ↔ salesperson pairs)
  spId?: string
}

export const MessagesPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const queryClient = useQueryClient()
  const [activeOtherId, setActiveOtherId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  // Non-admin: their own threads.
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['messageThreads'],
    queryFn: async () => messagesApi.listThreads(),
    refetchInterval: 15_000,
    enabled: !isAdmin,
  })

  // Admin: every conversation across the org.
  const { data: adminConvData, isLoading: adminConvLoading } = useQuery({
    queryKey: ['adminAllConversations'],
    queryFn: async () => messagesApi.listAllConversations(),
    refetchInterval: 15_000,
    enabled: isAdmin,
  })

  // For customers: auto-select assigned salesperson if no threads yet
  const { data: customerData } = useQuery({
    queryKey: ['customerProfile', user?.customerProfileId],
    queryFn: async () => {
      if (!user?.customerProfileId) throw new Error('no profile')
      const r = await customersApi.getCustomerById(user.customerProfileId)
      return r.customer
    },
    enabled: user?.role === 'customer' && !!user?.customerProfileId,
  })

  const contactList: ThreadItem[] = useMemo(() => {
    if (isAdmin) {
      // Show unique customers with their salesperson thread. Dedupe by customer id.
      const seen = new Set<string>()
      const list: ThreadItem[] = []
      for (const c of (adminConvData?.conversations || [])) {
        const cust = c.userA.role === 'customer' ? c.userA : c.userB.role === 'customer' ? c.userB : null
        if (!cust) continue
        if (seen.has(cust.id)) continue
        seen.add(cust.id)
        const other = c.userA.id === cust.id ? c.userB : c.userA
        list.push({
          otherUserId: cust.id,          // admin replies TO the customer
          otherName: cust.Name,
          otherRole: 'customer',
          lastMessage: {
            text: c.lastMessage.text,
            createdAt: c.lastMessage.createdAt,
            mine: false,
          },
          unread: c.unread,
          spName: other.role === 'salesperson' ? other.Name : undefined,
          spId: other.role === 'salesperson' ? other.id : undefined,
        })
      }
      return list
    }
    const threads = threadsData?.threads || []
    if (threads.length > 0) return threads
    if (user?.role === 'customer' && customerData?.assignedSalesperson) {
      return [{
        otherUserId: customerData.assignedSalesperson.id,
        otherName: customerData.assignedSalesperson.Name,
        otherRole: 'salesperson',
        lastMessage: { text: 'Start a new conversation…', createdAt: new Date().toISOString(), mine: false },
        unread: 0,
      }]
    }
    return []
  }, [isAdmin, adminConvData, threadsData, user?.role, customerData])

  useEffect(() => {
    if (!activeOtherId && contactList.length > 0) setActiveOtherId(contactList[0].otherUserId)
  }, [contactList, activeOtherId])

  const activeContact = contactList.find((t) => t.otherUserId === activeOtherId)

  // For admin: fetch the customer↔salesperson thread. For non-admin: normal thread with the other party.
  const { data: threadData } = useQuery({
    queryKey: isAdmin ? ['adminThread', activeOtherId, activeContact?.spId] : ['messageThread', activeOtherId],
    queryFn: async () => {
      if (!activeOtherId) return null
      if (isAdmin) {
        if (!activeContact?.spId) return { messages: [], other: { Name: activeContact?.otherName, role: 'customer' } }
        return messagesApi.getAnyThread(activeOtherId, activeContact.spId)
      }
      return messagesApi.getThread(activeOtherId)
    },
    enabled: !!activeOtherId,
    refetchInterval: 8_000,
  })

  const send = useMutation({
    mutationFn: (text: string) => messagesApi.send(activeOtherId!, text),
    onSuccess: () => {
      setDraft('')
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['adminThread', activeOtherId, activeContact?.spId] })
        queryClient.invalidateQueries({ queryKey: ['adminAllConversations'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['messageThread', activeOtherId] })
        queryClient.invalidateQueries({ queryKey: ['messageThreads'] })
      }
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to send.'),
  })

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [threadData?.messages?.length])

  const loading = isAdmin ? adminConvLoading : threadsLoading
  if (loading) return <LoadingState message="Loading messages…" />

  const meId = user?.id
  const isMineMsg = (m: any) =>
    m.mine === true ||
    (m.from?.toString?.() === meId) ||
    (m.authorId?.toString?.() === meId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-brand-600" />
        <h1 className="font-display text-2xl font-bold text-gray-900">Messages</h1>
      </div>

      {contactList.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">
              {user?.role === 'customer'
                ? 'No conversations yet. Once admin assigns you a salesperson, you can message them here.'
                : 'No conversations yet.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[600px]">
          {/* Thread list */}
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100 h-full overflow-y-auto">
              {contactList.map((t) => (
                <button
                  key={t.otherUserId}
                  onClick={() => setActiveOtherId(t.otherUserId)}
                  className={`w-full text-left p-3 hover:bg-surface-50 transition-colors ${activeOtherId === t.otherUserId ? 'bg-brand-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{t.otherName}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {t.otherRole}{t.spName ? ` · with ${t.spName}` : ''}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {t.lastMessage.mine ? 'You: ' : ''}{t.lastMessage.text}
                      </p>
                    </div>
                    {t.unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold grid place-items-center flex-none">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Active thread */}
          <Card className="flex flex-col overflow-hidden">
            {!activeOtherId ? (
              <div className="flex-1 grid place-items-center text-gray-500 text-sm">
                Select a conversation.
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">{activeContact?.otherName || threadData?.other?.Name || '—'}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {activeContact?.otherRole || threadData?.other?.role || ''}
                    {activeContact?.spName ? ` · with salesperson ${activeContact.spName}` : ''}
                  </p>
                </div>

                <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-50">
                  {(!threadData?.messages || threadData.messages.length === 0) && (
                    <p className="text-center text-sm text-gray-500 py-8">No messages yet. Say hi 👋</p>
                  )}
                  {(threadData?.messages || []).map((m: any) => {
                    const mine = isMineMsg(m)
                    const viaAdmin = !!m.authorId && m.authorRole === 'admin'
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? 'gradient-brand text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'}`}>
                          {viaAdmin && (
                            <p className={`text-[10px] font-semibold flex items-center gap-1 mb-0.5 ${mine ? 'text-white/90' : 'text-amber-700'}`}>
                              <ShieldCheck className="h-3 w-3" /> via admin {m.authorName ? `· ${m.authorName}` : ''}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <p className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-gray-400'} text-right`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form
                  className="p-3 border-t border-gray-100 flex gap-2 bg-white"
                  onSubmit={(e) => { e.preventDefault(); if (draft.trim()) send.mutate(draft.trim()) }}
                >
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 self-center">
                      <ShieldCheck className="h-3 w-3" /> as admin
                    </span>
                  )}
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isAdmin ? `Reply to ${activeContact?.otherName || 'customer'}…` : 'Type a message…'}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
                    maxLength={2000}
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || send.isPending}
                    className="h-11 w-11 rounded-full gradient-brand text-white grid place-items-center shadow-[var(--shadow-glow)] disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
