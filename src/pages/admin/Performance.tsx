import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Badge } from '../../components/status/StatusBadge'
import { performanceApi } from '../../api'
import { Trophy, IndianRupee, TrendingUp, FileText, ClipboardList, Users, Search } from 'lucide-react'

type SortKey = 'ranking' | 'totalSales' | 'totalPaymentsCollected' | 'acceptedQuotations' | 'conversionRate' | 'completedFollowUps'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const AdminPerformance = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('ranking')

  const { data, isLoading } = useQuery({
    queryKey: ['salespersonComparison'],
    queryFn: async () => performanceApi.getSalespersonComparison(),
  })

  const rows: any[] = data?.comparison || []

  const teamTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.revenue += r.totalSales || 0
        acc.payments += r.totalPaymentsCollected || 0
        acc.quotations += r.acceptedQuotations || 0
        acc.followUps += r.completedFollowUps || 0
        return acc
      },
      { revenue: 0, payments: 0, quotations: 0, followUps: 0 }
    )
  }, [rows])

  const topPerformer = rows.find((r) => r.ranking === 1) || rows[0]
  const avgConversion =
    rows.length > 0
      ? (rows.reduce((a, r) => a + (r.conversionRate || 0), 0) / rows.length).toFixed(1)
      : '0.0'
  const maxRevenue = Math.max(1, ...rows.map((r) => r.totalSales || 0))

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) => !q || r.salespersonName?.toLowerCase().includes(q))
    return [...list].sort((a, b) => {
      if (sortBy === 'ranking') return (a.ranking ?? 999) - (b.ranking ?? 999)
      return (b[sortBy] ?? 0) - (a[sortBy] ?? 0)
    })
  }, [rows, query, sortBy])

  if (isLoading) return <LoadingState message="Loading performance…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Team Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Sales, quotations, follow-ups and collections per salesperson.</p>
      </div>

      {/* Team totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <TeamTile icon={IndianRupee}   tone="brand"   label="Team revenue"           value={money(teamTotals.revenue)}   onClick={() => navigate('/admin/orders')} />
        <TeamTile icon={IndianRupee}   tone="emerald" label="Payments collected"     value={money(teamTotals.payments)}  onClick={() => navigate('/admin/payments')} />
        <TeamTile icon={FileText}      tone="sky"     label="Accepted quotations"    value={teamTotals.quotations}       onClick={() => navigate('/admin/quotations')} />
        <TeamTile icon={ClipboardList} tone="amber"   label="Completed follow-ups"   value={teamTotals.followUps}        onClick={() => navigate('/admin/customers')} />
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <button
          type="button"
          disabled={!topPerformer}
          onClick={() => topPerformer && navigate(`/admin/employees/${topPerformer.salespersonId}`)}
          className="text-left rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 grid place-items-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Top performer</p>
              <p className="font-display text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {topPerformer?.salespersonName || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{money(topPerformer?.totalSales || 0)} in sales</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/employees')}
          className="text-left rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Team size</p>
              <p className="font-display text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {rows.length} salesperson{rows.length === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">View all employees</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/quotations')}
          className="text-left rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg conversion</p>
              <p className="font-display text-lg font-bold text-gray-900 leading-tight mt-0.5">{avgConversion}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Quotation → sale</p>
            </div>
          </div>
        </button>
      </div>

      {/* Table */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h3 className="font-display text-lg font-bold text-gray-900">Salesperson leaderboard</h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search salesperson…"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
              >
                <option value="ranking">Sort · Rank</option>
                <option value="totalSales">Sort · Revenue</option>
                <option value="totalPaymentsCollected">Sort · Collections</option>
                <option value="acceptedQuotations">Sort · Quotations won</option>
                <option value="completedFollowUps">Sort · Follow-ups done</option>
                <option value="conversionRate">Sort · Conversion</option>
              </select>
            </div>
          </div>

          {filteredSorted.length === 0 ? (
            <p className="text-gray-500 text-sm py-10 text-center">No salesperson data available.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    <th className="py-3 pr-4">Rank</th>
                    <th className="py-3 pr-4">Salesperson</th>
                    <th className="py-3 pr-4 text-right">Revenue</th>
                    <th className="py-3 pr-4 text-right">Collections</th>
                    <th className="py-3 pr-4 text-right">Quotations (accepted / total)</th>
                    <th className="py-3 pr-4 text-right">Follow-ups (done / total)</th>
                    <th className="py-3 pr-0">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSorted.map((r) => {
                    const pct = Math.min(100, Math.round(((r.totalSales || 0) / maxRevenue) * 100))
                    return (
                      <tr
                        key={r.salespersonId}
                        onClick={() => navigate(`/admin/employees/${r.salespersonId}`)}
                        className="cursor-pointer hover:bg-surface-50"
                      >
                        <td className="py-3 pr-4">
                          <RankPill rank={r.ranking} />
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{r.salespersonName}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold">{money(r.totalSales)}</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-surface-100 overflow-hidden w-32 ml-auto">
                            <div className="h-full gradient-brand rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">{money(r.totalPaymentsCollected)}</td>
                        <td className="py-3 pr-4 text-right">
                          <span className="font-semibold">{r.acceptedQuotations || 0}</span>
                          <span className="text-gray-500"> / {r.totalQuotations || 0}</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="font-semibold">{r.completedFollowUps || 0}</span>
                          <span className="text-gray-500"> / {r.totalFollowUps || 0}</span>
                        </td>
                        <td className="py-3 pr-0">
                          <Badge
                            variant={r.conversionRate >= 50 ? 'success' : r.conversionRate >= 20 ? 'info' : 'default'}
                          >
                            {(r.conversionRate ?? 0)}%
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

const TeamTile = ({
  icon: Icon, tone, label, value, onClick,
}: { icon: any; tone: 'brand' | 'emerald' | 'sky' | 'amber'; label: string; value: any; onClick?: () => void }) => {
  const tones = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky:     'bg-sky-50 text-sky-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="text-left w-full rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
      >
        {inner}
      </button>
    )
  }
  return <Card hover><CardBody>{inner}</CardBody></Card>
}

const RankPill = ({ rank }: { rank: number }) => {
  if (!rank) return <span className="text-gray-400">—</span>
  const badge =
    rank === 1 ? 'bg-amber-100 text-amber-800' :
    rank === 2 ? 'bg-gray-200 text-gray-800' :
    rank === 3 ? 'bg-orange-100 text-orange-800' :
    'bg-surface-100 text-gray-600'
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${badge}`}>
      #{rank}
    </span>
  )
}
