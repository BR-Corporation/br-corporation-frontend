import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dashboardsApi, notificationsApi } from '../../api'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/status/StatusBadge'
import {
  Users, ShoppingCart, IndianRupee, TrendingUp, Clock, ArrowRight,
  Bell, ShoppingBag, RotateCcw, FileText, PackageX, Sparkles, CheckCheck,
} from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const ATTENTION_TYPES = new Set([
  'order_created', 'return_created', 'quotation_requested',
  'low_stock', 'customer_registered',
])

const iconFor = (type: string) => {
  if (type === 'order_created') return ShoppingBag
  if (type === 'return_created') return RotateCcw
  if (type === 'quotation_requested') return FileText
  if (type === 'low_stock') return PackageX
  return Bell
}

const toneFor = (type: string) => {
  if (type === 'order_created') return 'bg-emerald-50 text-emerald-700'
  if (type === 'return_created') return 'bg-rose-50 text-rose-700'
  if (type === 'quotation_requested') return 'bg-brand-50 text-brand-700'
  if (type === 'low_stock') return 'bg-amber-50 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

const linkFor = (n: any) => {
  const ref = (n.referenceEntity || '').toLowerCase()
  const id = n.referenceId
  if (!id) return '/admin/notifications'
  if (ref === 'order') return `/admin/orders/${id}`
  if (ref === 'orderreturn') return `/admin/returns/${id}`
  if (ref === 'quotationrequest') return `/admin/quotation-requests`
  if (ref === 'quotation') return `/admin/quotations/${id}`
  if (ref === 'customerprofile') return `/admin/customers/${id}`
  if (ref === 'product') return `/admin/products/${id}`
  return '/admin/notifications'
}

const timeAgo = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => (await dashboardsApi.getAdminDashboard()).dashboard,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    staleTime: 0,
  })

  const { data: notifData } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: async () => notificationsApi.getNotifications({ limit: 30 }),
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] })
    },
  })

  const notifications: any[] = notifData?.notifications || []

  const attention = useMemo(
    () => notifications.filter((n) => ATTENTION_TYPES.has(n.type)),
    [notifications]
  )

  const attentionCounts = useMemo(() => {
    const c = { orders: 0, returns: 0, requests: 0, stock: 0 }
    for (const n of attention) {
      if (n.isRead) continue
      if (n.type === 'order_created') c.orders++
      else if (n.type === 'return_created') c.returns++
      else if (n.type === 'quotation_requested') c.requests++
      else if (n.type === 'low_stock') c.stock++
    }
    return c
  }, [attention])

  const unreadAttention = attention.filter((n) => !n.isRead).length

  if (isLoading) return <LoadingState message="Loading dashboard…" />

  const dashboard: any = data || {}
  const customers = dashboard.customers || {}
  const sales     = dashboard.sales || {}
  const finance   = dashboard.finance || {}
  const pendingCustomers = customers.pending || 0

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Live · updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
            {isFetching && <span className="ml-2 text-brand-600 animate-pulse">refreshing…</span>}
          </p>
        </div>
      </div>

      {pendingCustomers > 0 && (
        <div className="rounded-2xl gradient-brand-subtle border border-brand-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white text-brand-700 grid place-items-center shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-gray-900">
                {pendingCustomers} customer{pendingCustomers === 1 ? '' : 's'} waiting for approval
              </p>
              <p className="text-sm text-gray-600">Review, approve and assign a salesperson.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/admin/customers?status=pending')}>Review customers</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tile
          icon={Users}
          tone="brand"
          label="Total customers"
          value={customers.total ?? 0}
          hint={customers.new != null ? `${customers.new} new this month` : undefined}
          onClick={() => navigate('/admin/customers')}
        />
        <Tile
          icon={ShoppingCart}
          tone="sky"
          label="Total orders"
          value={sales.totalOrders ?? 0}
          hint={sales.averageOrderValue != null ? `AOV ${money(sales.averageOrderValue)}` : undefined}
          onClick={() => navigate('/admin/orders')}
        />
        <Tile
          icon={IndianRupee}
          tone="emerald"
          label="Net revenue"
          value={money(finance.totalRevenue)}
          hint={
            finance.paymentsCollected != null
              ? `Received ${money(finance.paymentsCollected)} · after returns`
              : 'After completed returns'
          }
          onClick={() => navigate('/admin/payments')}
        />
        <Tile
          icon={TrendingUp}
          tone="amber"
          label="Outstanding"
          value={money(finance.outstandingAmount)}
          hint={finance.overduePayments != null ? `${finance.overduePayments} overdue` : 'Unpaid + partial orders'}
          onClick={() => navigate('/admin/orders?paymentStatus=unpaid')}
        />
      </div>

      {/* Needs attention chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AttentionChip
          icon={ShoppingBag} tone="emerald"
          label="New orders" count={attentionCounts.orders}
          onClick={() => navigate('/admin/orders')}
        />
        <AttentionChip
          icon={RotateCcw} tone="rose"
          label="New returns" count={attentionCounts.returns}
          onClick={() => navigate('/admin/returns')}
        />
        <AttentionChip
          icon={FileText} tone="brand"
          label="Quotation requests" count={attentionCounts.requests}
          onClick={() => navigate('/admin/quotation-requests')}
        />
        <AttentionChip
          icon={PackageX} tone="amber"
          label="Low stock alerts" count={attentionCounts.stock}
          onClick={() => navigate('/admin/inventory')}
        />
      </div>

      {/* Notifications — replaces the old inventory/quotations/follow-ups strip */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadAttention > 0
                    ? `${unreadAttention} item${unreadAttention === 1 ? '' : 's'} need your attention`
                    : 'You\'re all caught up'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadAttention > 0 && (
                <Button variant="ghost" size="sm" loading={markAll.isPending} onClick={() => markAll.mutate()}>
                  <CheckCheck className="h-4 w-4" /> Mark all read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/notifications')}>
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="font-semibold text-gray-900">Nothing new</p>
              <p className="text-sm text-gray-500 mt-1">New orders, returns and quotation requests will show up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.slice(0, 12).map((n: any) => {
                const Icon = iconFor(n.type)
                return (
                  <li
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id)
                      navigate(linkFor(n))
                    }}
                    className={`py-3 flex items-start gap-3 cursor-pointer hover:bg-surface-50 -mx-2 px-2 rounded-lg ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                  >
                    <span className={`h-9 w-9 shrink-0 rounded-lg grid place-items-center ${toneFor(n.type)}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                          {n.title || n.type}
                        </p>
                        {!n.isRead && <Badge variant="brand">New</Badge>}
                      </div>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

const Tile = ({
  icon: Icon, tone, label, value, hint, onClick,
}: {
  icon: any; tone: 'brand' | 'sky' | 'emerald' | 'amber'; label: string; value: any; hint?: string; onClick?: () => void
}) => {
  const tones = {
    brand:   'bg-brand-50 text-brand-700',
    sky:     'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-gray-900 truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-xs font-semibold text-brand-700 inline-flex items-center gap-1">
        View details <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  )
}

const AttentionChip = ({
  icon: Icon, tone, label, count, onClick,
}: { icon: any; tone: 'brand' | 'emerald' | 'rose' | 'amber'; label: string; count: number; onClick?: () => void }) => {
  const tones = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose:    'bg-rose-50 text-rose-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all hover:shadow-[var(--shadow-soft)] ${count > 0 ? 'border-brand-200 bg-white' : 'border-gray-100 bg-white opacity-90'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`h-10 w-10 rounded-lg grid place-items-center ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-extrabold text-gray-900 leading-none">{count}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
        </div>
      </div>
    </button>
  )
}
