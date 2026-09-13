import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { performanceApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Users, ShoppingCart, IndianRupee, TrendingUp, FileText, PhoneCall, Wallet, Calendar } from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const defaultRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export const SalespersonPerformance = () => {
  const { user } = useAuth()
  const [{ start, end }, setRange] = useState(defaultRange())

  const { data, isLoading } = useQuery({
    queryKey: ['salespersonPerformance', user?.id, start, end],
    queryFn: async () => performanceApi.getSalespersonPerformance(user!.id, { startDate: start, endDate: end }),
    enabled: !!user?.id,
  })

  const setPreset = (days: number) => {
    const e = new Date(); const s = new Date(); s.setDate(e.getDate() - days)
    setRange({ start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) })
  }

  if (isLoading) return <LoadingState message="Loading performance…" />

  const p: any = data?.performance || {}
  const c = p.customers || {}
  const q = p.quotations || {}
  const o = p.orders || {}
  const f = p.followUps || {}
  const pay = p.payments || {}
  const conv = p.conversionRate ?? q.conversionRate ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Your customers, quotations, orders and collections.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input type="date" value={start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} className="text-sm outline-none" />
            <span className="text-xs text-gray-500">to</span>
            <input type="date" value={end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} className="text-sm outline-none" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => setPreset(7)} className="text-xs px-3 py-2 rounded-full bg-surface-100">7d</button>
            <button onClick={() => setPreset(30)} className="text-xs px-3 py-2 rounded-full bg-surface-100">30d</button>
            <button onClick={() => setPreset(90)} className="text-xs px-3 py-2 rounded-full bg-surface-100">90d</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile icon={Users} tone="brand" label="Customers" value={c.assigned ?? 0} hint={`${c.new ?? 0} new`} />
        <Tile icon={ShoppingCart} tone="sky" label="Orders" value={o.created ?? 0} hint={`${o.completed ?? 0} completed`} />
        <Tile icon={IndianRupee} tone="emerald" label="Total sales" value={money(o.totalSales)} hint={`AOV ${money(o.averageOrderValue)}`} />
        <Tile icon={TrendingUp} tone="amber" label="Conversion" value={`${conv}%`} hint={`${q.accepted ?? 0}/${q.sent ?? q.created ?? 0} accepted`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><FileText className="h-5 w-5" /></div>
              <h3 className="font-display text-lg font-bold text-gray-900">Quotations</h3>
            </div>
            <Row label="Created" value={q.created ?? 0} />
            <Row label="Sent" value={q.sent ?? 0} />
            <Row label="Accepted" value={q.accepted ?? 0} tone="emerald" />
            <Row label="Rejected" value={q.rejected ?? 0} tone="rose" />
            <Row label="Conversion rate" value={`${q.conversionRate ?? 0}%`} tone="brand" />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><ShoppingCart className="h-5 w-5" /></div>
              <h3 className="font-display text-lg font-bold text-gray-900">Orders</h3>
            </div>
            <Row label="Created" value={o.created ?? 0} />
            <Row label="Completed" value={o.completed ?? 0} tone="emerald" />
            <Row label="Total sales" value={money(o.totalSales)} tone="emerald" />
            <Row label="Average order value" value={money(o.averageOrderValue)} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><Wallet className="h-5 w-5" /></div>
              <h3 className="font-display text-lg font-bold text-gray-900">Collections</h3>
            </div>
            <Row label="Collected" value={money(pay.collected)} tone="emerald" />
            <Row label="Outstanding" value={money(pay.outstanding)} tone="amber" />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><PhoneCall className="h-5 w-5" /></div>
              <h3 className="font-display text-lg font-bold text-gray-900">Follow-ups</h3>
            </div>
            <Row label="Total" value={f.total ?? 0} />
            <Row label="Completed" value={f.completed ?? 0} tone="emerald" />
            <Row label="Pending" value={f.pending ?? 0} />
            <Row label="Overdue" value={f.overdue ?? 0} tone="rose" />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

const Tile = ({ icon: Icon, tone, label, value, hint }: { icon: any; tone: 'brand' | 'sky' | 'emerald' | 'amber'; label: string; value: any; hint?: string }) => {
  const tones: any = { brand: 'bg-brand-50 text-brand-700', sky: 'bg-sky-50 text-sky-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700' }
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 font-display text-xl font-extrabold text-gray-900 truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500 truncate">{hint}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  )
}

const Row = ({ label, value, tone }: { label: string; value: any; tone?: 'emerald' | 'rose' | 'brand' | 'amber' }) => {
  const colors: any = { emerald: 'text-emerald-700', rose: 'text-rose-600', brand: 'text-brand-700', amber: 'text-amber-700' }
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-semibold ${tone ? colors[tone] : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}
