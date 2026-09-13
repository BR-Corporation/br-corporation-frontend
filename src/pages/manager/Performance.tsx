import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { performanceApi } from '../../api'
import { Trophy, IndianRupee, FileText, Users } from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const ManagerPerformance = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['salespersonComparison'],
    queryFn: async () => performanceApi.getSalespersonComparison(),
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })

  const rows: any[] = data?.comparison || []

  const totals = useMemo(() => rows.reduce((a, r) => {
    a.sales += r.totalSales || 0
    a.orders += r.totalOrders || 0
    a.acceptedQuotations += r.acceptedQuotations || 0
    a.collections += r.totalPaymentsCollected || 0
    return a
  }, { sales: 0, orders: 0, acceptedQuotations: 0, collections: 0 }), [rows])

  const avgConversion = rows.length > 0
    ? (rows.reduce((s, r) => s + (r.conversionRate || 0), 0) / rows.length).toFixed(1)
    : '0.0'
  const top = rows.find((r: any) => r.ranking === 1) || rows[0]
  const maxSales = Math.max(1, ...rows.map((r: any) => r.totalSales || 0))

  if (isLoading) return <LoadingState message="Loading performance…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Team Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Sales, quotations and collections per salesperson.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={Users} tone="brand" label="Salespeople" value={rows.length} />
        <Tile icon={IndianRupee} tone="emerald" label="Total sales" value={money(totals.sales)} hint={`${totals.orders} orders`} />
        <Tile icon={FileText} tone="sky" label="Accepted quotes" value={totals.acceptedQuotations} hint={`Avg conversion ${avgConversion}%`} />
        <Tile icon={Trophy} tone="amber" label="Top performer" value={top?.salespersonName || '—'} hint={top ? `${money(top.totalSales)} in sales` : ''} />
      </div>

      <Card>
        <CardBody>
          <h3 className="font-display text-lg font-bold text-gray-900 mb-4">Ranking</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No salespeople yet.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((sp: any) => (
                <div key={sp.salespersonId} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-8 w-8 rounded-full grid place-items-center text-xs font-bold ${sp.ranking === 1 ? 'bg-amber-100 text-amber-800' : 'bg-surface-100 text-gray-700'}`}>
                        #{sp.ranking ?? '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{sp.salespersonName}</p>
                        <p className="text-xs text-gray-500">{sp.totalOrders} orders</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-xl font-extrabold text-gray-900">{money(sp.totalSales)}</p>
                      <p className="text-xs text-gray-500">{sp.conversionRate ?? 0}% conversion</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${((sp.totalSales || 0) / maxSales) * 100}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    <span>Quotes sent: <span className="font-semibold text-gray-900">{sp.totalQuotations ?? 0}</span></span>
                    <span>Accepted: <span className="font-semibold text-gray-900">{sp.acceptedQuotations ?? 0}</span></span>
                    <span>Collected: <span className="font-semibold text-gray-900">{money(sp.totalPaymentsCollected)}</span></span>
                    <span>Follow-ups done: <span className="font-semibold text-gray-900">{sp.completedFollowUps ?? 0}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
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
