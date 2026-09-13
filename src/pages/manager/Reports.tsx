import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/status/StatusBadge'
import { reportsApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import {
  IndianRupee, Download, Calendar, TrendingUp,
} from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const toCsv = (rows: any[], columns: { key: string; header: string }[]) => {
  if (!rows.length) return ''
  const head = columns.map((c) => `"${c.header}"`).join(',')
  const body = rows.map((r) =>
    columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  return `${head}\n${body}`
}
const downloadCsv = (name: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
}

const defaultRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export const ManagerReports = () => {
  const { user } = useAuth()
  const [{ start, end }, setRange] = useState(defaultRange())

  const params = { startDate: start, endDate: end }

  const team = useQuery({
    queryKey: ['reports:manager', user?.id, start, end],
    queryFn: () => reportsApi.getManagerReport(user!.id, params),
    enabled: !!user?.id,
  })
  const products = useQuery({
    queryKey: ['reports:products'],
    queryFn: () => reportsApi.getProductReport(),
  })
  const inventory = useQuery({
    queryKey: ['reports:inventory'],
    queryFn: () => reportsApi.getInventoryReport(),
  })

  const setPreset = (days: number) => {
    const e = new Date(); const s = new Date(); s.setDate(e.getDate() - days)
    setRange({ start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) })
  }

  const t = team.data?.report || {}
  const p = products.data?.report || {}
  const i = inventory.data?.report || {}

  const sps: any[] = t.salespersonReports || []
  const maxSp = useMemo(() => Math.max(1, ...sps.map((sp: any) => sp?.sales?.totalSales || 0)), [sps])

  if (team.isLoading || products.isLoading || inventory.isLoading) {
    return <LoadingState message="Loading reports…" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Your team + inventory performance.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={IndianRupee} tone="emerald" label="Team sales" value={money(t.teamSales)} />
        <Tile icon={TrendingUp} tone="sky" label="Team orders" value={t.teamOrders ?? 0} />
        <Tile icon={IndianRupee} tone="amber" label="Team collections" value={money(t.teamCollections)} />
        <Tile icon={TrendingUp} tone="brand" label="Team conversion" value={`${t.teamConversionRate ?? 0}%`} hint={`${t.teamQuotations ?? 0} quotations`} />
      </div>

      <Card>
        <CardBody>
          <Header title="Salespeople in your team" onExport={() =>
            downloadCsv(`team_${start}_${end}.csv`, toCsv(sps.map((sp: any) => ({
              name: sp.salespersonName, orders: sp.orders?.created,
              sales: sp.sales?.totalSales, collections: sp.collections?.collected, conversion: sp.conversionRate,
            })), [
              { key: 'name', header: 'Salesperson' }, { key: 'orders', header: 'Orders' },
              { key: 'sales', header: 'Sales' }, { key: 'collections', header: 'Collections' }, { key: 'conversion', header: 'Conversion %' },
            ]))
          } />
          {sps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No salespeople assigned to you.</p>
          ) : (
            <div className="space-y-3">
              {sps.map((sp: any) => (
                <div key={sp.salespersonId} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{sp.salespersonName}</p>
                    <span className="text-sm text-gray-500">{sp.orders?.created ?? 0} orders · <span className="font-semibold text-gray-900">{money(sp.sales?.totalSales)}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${((sp.sales?.totalSales || 0) / maxSp) * 100}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    <span>Quotations: <span className="font-semibold text-gray-900">{sp.quotations?.created ?? 0}</span></span>
                    <span>Accepted: <span className="font-semibold text-gray-900">{sp.quotations?.accepted ?? 0}</span></span>
                    <span>Collected: <span className="font-semibold text-gray-900">{money(sp.collections?.collected)}</span></span>
                    <span>Conversion: <span className="font-semibold text-gray-900">{sp.conversionRate ?? 0}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <Header title="Low stock" />
            <SimpleTable
              columns={[{ h: 'Product' }, { h: 'SKU' }, { h: 'Stock', align: 'right' }]}
              rows={(i.lowStockProducts || []).map((r: any) => [r.name, r.SKU, r.stock])}
              empty="Nothing low."
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Header title="Out of stock" />
            <SimpleTable
              columns={[{ h: 'Product' }, { h: 'SKU' }]}
              rows={(i.outOfStockProducts || []).map((r: any) => [r.name, r.SKU])}
              empty="Nothing out."
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <Header title="Products overview" onExport={() =>
            downloadCsv(`products.csv`, toCsv(p.products || [], [
              { key: 'name', header: 'Name' }, { key: 'SKU', header: 'SKU' },
              { key: 'category', header: 'Category' }, { key: 'sellingPrice', header: 'Price' },
              { key: 'stock', header: 'Stock' }, { key: 'status', header: 'Status' },
            ]))
          } />
          <SimpleTable
            columns={[{ h: 'Name' }, { h: 'SKU' }, { h: 'Category' }, { h: 'Price', align: 'right' }, { h: 'Stock', align: 'right' }, { h: 'Status' }]}
            rows={(p.products || []).slice(0, 100).map((r: any) => [
              r.name, r.SKU, r.category, money(r.sellingPrice), r.stock,
              <Badge key="s" variant={r.status === 'active' ? 'success' : 'default'} className="capitalize">{r.status}</Badge>,
            ])}
            empty="No products."
          />
        </CardBody>
      </Card>
    </div>
  )
}

const Tile = ({ icon: Icon, tone, label, value, hint }: { icon: any; tone: 'brand' | 'sky' | 'emerald' | 'amber' | 'rose'; label: string; value: any; hint?: string }) => {
  const tones: any = { brand: 'bg-brand-50 text-brand-700', sky: 'bg-sky-50 text-sky-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' }
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gray-900 truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500 truncate">{hint}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  )
}

const Header = ({ title, onExport }: { title: string; onExport?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
    {onExport && <Button size="sm" variant="ghost" onClick={onExport}><Download className="h-3.5 w-3.5" /> Export CSV</Button>}
  </div>
)

const SimpleTable = ({ columns, rows, empty }: { columns: { h: string; align?: 'left' | 'right' }[]; rows: any[][]; empty: string }) => {
  if (rows.length === 0) return <p className="text-sm text-gray-500 text-center py-6">{empty}</p>
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
            {columns.map((c, i) => (<th key={i} className={`py-2 pr-4 ${c.align === 'right' ? 'text-right' : ''}`}>{c.h}</th>))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((cell, ci) => (<td key={ci} className={`py-2 pr-4 ${columns[ci]?.align === 'right' ? 'text-right' : ''}`}>{cell}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
