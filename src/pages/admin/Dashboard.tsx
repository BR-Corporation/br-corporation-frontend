import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dashboardsApi, notificationsApi } from '../../api'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/status/StatusBadge'
import {
  Users, ShoppingCart, IndianRupee, TrendingUp, Clock, ArrowRight,
  PackageX, PackageOpen, FileText, ClipboardList,
} from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await dashboardsApi.getAdminDashboard()
      return response.dashboard
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30_000,
    staleTime: 0,
  })

  const { data: notifData } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: async () => notificationsApi.getNotifications({ limit: 8 }),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
  const notifications: any[] = notifData?.notifications || []

  if (isLoading) return <LoadingState message="Loading dashboard…" />

  const dashboard: any = data || {}
  const customers  = dashboard.customers || {}
  const sales      = dashboard.sales || {}
  const finance    = dashboard.finance || {}
  const inventory  = dashboard.inventory || {}
  const quotations = dashboard.quotations || {}
  const followUps  = dashboard.followUps || {}

  const pendingCustomers = customers.pending || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Live · updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
            {isFetching && <span className="ml-2 text-brand-600 animate-pulse">refreshing…</span>}
          </p>
        </div>
      </div>

      {/* Pending approvals banner */}
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

      {/* Headline tiles */}
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

      {/* Recent activity */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-gray-900">Recent activity</h3>
            <button
              onClick={() => navigate('/admin/notifications')}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.slice(0, 8).map((n: any) => {
                const ref = n.referenceEntity?.toLowerCase()
                const target =
                  ref === 'order' && n.referenceId ? `/admin/orders/${n.referenceId}` :
                  ref === 'quotation' && n.referenceId ? `/admin/quotations/${n.referenceId}` :
                  ref === 'customerprofile' && n.referenceId ? `/admin/customers/${n.referenceId}` :
                  '/admin/notifications'
                return (
                  <li
                    key={n.id}
                    onClick={() => navigate(target)}
                    className="py-3 flex items-start gap-3 cursor-pointer hover:bg-surface-50 -mx-2 px-2 rounded-lg"
                  >
                    <span className={`h-2 w-2 rounded-full mt-2 ${n.isRead ? 'bg-gray-300' : 'bg-brand-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                        {n.title || n.type}
                      </p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Two column extras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Inventory</h3>
              <button
                onClick={() => navigate('/admin/inventory')}
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                Open <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              <MiniRow icon={PackageOpen} tone="brand"  label="Total products" value={inventory.totalProducts ?? 0} />
              <MiniRow icon={PackageOpen} tone="amber"  label="Low stock"      value={inventory.lowStockProducts ?? 0} />
              <MiniRow icon={PackageX}    tone="rose"   label="Out of stock"   value={inventory.outOfStockProducts ?? 0} />
            </div>
          </CardBody>
        </Card>

        {/* Quotations */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Quotations</h3>
              <button
                onClick={() => navigate('/admin/quotations')}
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                Open <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              <MiniRow icon={FileText} tone="brand"   label="Total sent"       value={quotations.total ?? 0} />
              <MiniRow icon={FileText} tone="emerald" label="Accepted"         value={quotations.accepted ?? 0} />
              <MiniRow icon={FileText} tone="rose"    label="Rejected"         value={quotations.rejected ?? 0} />
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Conversion rate</span>
                <Badge variant={((quotations.conversionRate || 0) >= 50) ? 'success' : 'info'}>
                  {quotations.conversionRate ?? 0}%
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Follow-ups */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Follow-ups</h3>
              <button
                onClick={() => navigate('/admin/customers')}
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                Customers <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              <MiniRow icon={ClipboardList} tone="brand" label="Total"      value={followUps.total ?? 0} />
              <MiniRow icon={ClipboardList} tone="rose"  label="Overdue"    value={followUps.overdue ?? 0} />
            </div>
          </CardBody>
        </Card>
      </div>
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

const MiniRow = ({
  icon: Icon, tone, label, value,
}: { icon: any; tone: 'brand' | 'amber' | 'rose' | 'emerald'; label: string; value: any }) => {
  const tones = {
    brand:   'bg-brand-50 text-brand-700',
    amber:   'bg-amber-50 text-amber-700',
    rose:    'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`h-8 w-8 rounded-lg grid place-items-center ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="font-display text-lg font-bold text-gray-900">{value}</span>
    </div>
  )
}
