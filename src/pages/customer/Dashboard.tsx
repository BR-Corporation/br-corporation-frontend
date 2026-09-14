import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardsApi, notificationsApi } from '../../api'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Badge } from '../../components/status/StatusBadge'
import {
  ShoppingCart, FileText, CreditCard, ArrowRight, Sparkles, Package, RotateCcw,
  Bell, MessageCircle, IndianRupee, PackagePlus,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const notifIcon = (type: string) => {
  if (type === 'order_created' || type === 'order_confirmed' || type === 'order_completed') return ShoppingCart
  if (type === 'quotation_created' || type === 'quotation_sent' || type === 'quotation_requested') return FileText
  if (type === 'return_approved' || type === 'return_completed' || type === 'return_rejected') return RotateCcw
  if (type === 'payment_refunded' || type === 'payment_received') return IndianRupee
  if (type === 'message_received') return MessageCircle
  if (type === 'product_created') return PackagePlus
  return Bell
}
const notifTone = (type: string) => {
  if (type === 'order_completed' || type === 'return_completed' || type === 'quotation_created') return 'bg-emerald-50 text-emerald-700'
  if (type === 'return_rejected' || type === 'order_cancelled') return 'bg-rose-50 text-rose-700'
  if (type === 'payment_refunded') return 'bg-amber-50 text-amber-700'
  if (type === 'message_received') return 'bg-brand-50 text-brand-700'
  if (type === 'product_created') return 'bg-sky-50 text-sky-700'
  return 'bg-gray-100 text-gray-700'
}
const linkFor = (n: any) => {
  const ref = (n.referenceEntity || '').toLowerCase()
  const id = n.referenceId
  if (!id) return '/customer/notifications'
  if (ref === 'order') return `/customer/orders/${id}`
  if (ref === 'quotation') return `/customer/quotations/${id}`
  if (ref === 'quotationrequest') return `/customer/quotation-requests`
  if (ref === 'orderreturn') return `/customer/returns/${id}`
  if (ref === 'product') return `/customer/products`
  if (ref === 'message') return `/customer/messages`
  if (ref === 'payment') return `/customer/payments`
  return '/customer/notifications'
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

const StatTile = ({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: string | number; tone: 'brand' | 'emerald' | 'amber' }) => {
  const tones = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  return (
    <Card hover>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export const CustomerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const customerProfileId = user?.customerProfileId

  const { data, isLoading } = useQuery({
    queryKey: ['customerDashboard', customerProfileId],
    queryFn: async () => {
      if (!customerProfileId) throw new Error('Customer profile not found')
      const response = await dashboardsApi.getCustomerDashboard(customerProfileId)
      return response.dashboard
    },
    enabled: !!customerProfileId,
  })

  const { data: notifData } = useQuery({
    queryKey: ['customerNotifications'],
    queryFn: async () => notificationsApi.getNotifications({ limit: 20 }),
    refetchInterval: 15_000,
  })
  const notifications: any[] = notifData?.notifications || []
  const unread = notifications.filter((n) => !n.isRead).length

  if (isLoading) return <LoadingState message="Loading your dashboard…" />

  const dashboard = data || {}
  const orders = dashboard.orders?.data || []
  const quotations = dashboard.quotations?.data || []
  const outstanding = dashboard.payments?.outstanding || 0
  const firstName = user?.Name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand text-white p-8 shadow-[var(--shadow-glow)]">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-pink-400/25 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
              <Sparkles className="h-3.5 w-3.5" /> Your wholesale hub
            </div>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Hey {firstName}, welcome back 👋
            </h1>
            <p className="mt-2 text-white/85">
              Browse the latest catalog, track your orders and settle payments — all in one place.
            </p>
          </div>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-2 self-start md:self-auto rounded-full bg-white text-brand-700 px-5 py-3 text-sm font-semibold shadow-lg hover:bg-brand-50 transition-colors"
          >
            <Package className="h-4 w-4" />
            Browse products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatTile icon={ShoppingCart} label="Total orders" value={dashboard.orders?.total ?? orders.length} tone="brand" />
        <StatTile icon={FileText}     label="Quotations"    value={dashboard.quotations?.total ?? quotations.length} tone="emerald" />
        <StatTile icon={CreditCard}   label="Outstanding"    value={`₹${outstanding.toLocaleString()}`} tone="amber" />
      </div>

      {/* Two-column: Recent orders + Recent quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-gray-900">Recent orders</h3>
              <Link to="/customer/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {orders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{order.grandTotal?.toLocaleString()}</p>
                      {order.orderStatus && (
                        <Badge
                          dot
                          variant={
                            order.orderStatus === 'completed' ? 'success' :
                            order.orderStatus === 'cancelled' ? 'danger' :
                            order.orderStatus === 'processing' ? 'info' : 'warning'
                          }
                          className="mt-1"
                        >
                          {order.orderStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock icon={ShoppingCart} title="No orders yet" body="Your orders will appear here once your salesperson creates one." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-gray-900">Quotations</h3>
              <Link to="/customer/quotations" className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {quotations.length > 0 ? (
              <div className="space-y-3">
                {quotations.slice(0, 4).map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between rounded-xl bg-surface-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{q.id.slice(-6)}</p>
                      <p className="text-[11px] text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{q.grandTotal?.toLocaleString()}</p>
                      {q.status && (
                        <Badge
                          variant={
                            q.status === 'accepted' ? 'success' :
                            q.status === 'rejected' ? 'danger' :
                            q.status === 'converted' ? 'brand' :
                            q.status === 'sent' ? 'info' : 'default'
                          }
                          className="mt-1 capitalize"
                        >
                          {q.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock icon={FileText} title="No quotations" body="You'll see quotations from your salesperson here." />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unread > 0 ? `${unread} unread` : 'You\'re all caught up'}
                </p>
              </div>
            </div>
            <Link to="/customer/notifications" className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Nothing new yet. New quotations, order updates, refunds and messages will appear here.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.slice(0, 8).map((n: any) => {
                const Icon = notifIcon(n.type)
                return (
                  <li
                    key={n.id}
                    onClick={() => navigate(linkFor(n))}
                    className={`py-3 flex items-start gap-3 cursor-pointer hover:bg-surface-50 -mx-2 px-2 rounded-lg ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                  >
                    <span className={`h-9 w-9 shrink-0 rounded-lg grid place-items-center ${notifTone(n.type)}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>{n.title || n.type}</p>
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

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink to="/customer/orders"       icon={ShoppingCart} label="My orders" />
        <QuickLink to="/customer/quotations"   icon={FileText}     label="Quotations" />
        <QuickLink to="/customer/payments"     icon={CreditCard}   label="Payments" />
        <QuickLink to="/customer/returns"      icon={RotateCcw}    label="Returns" />
      </div>
    </div>
  )
}

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 hover:border-brand-200 hover:shadow-[var(--shadow-soft)] transition-all"
  >
    <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
      <Icon className="h-4 w-4" />
    </div>
    <span className="font-semibold text-sm text-gray-800">{label}</span>
  </Link>
)

const EmptyBlock = ({ icon: Icon, title, body }: { icon: any; title: string; body: string }) => (
  <div className="text-center py-10">
    <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-100 text-gray-500 grid place-items-center mb-3">
      <Icon className="h-5 w-5" />
    </div>
    <p className="font-semibold text-gray-900">{title}</p>
    <p className="text-sm text-gray-500 mt-1">{body}</p>
  </div>
)
