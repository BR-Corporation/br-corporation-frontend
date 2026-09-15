import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { productsApi } from '../../api'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Badge } from '../../components/status/StatusBadge'
import { getImageUrl } from '../../api/client'
import {
  Boxes, PackageOpen, PackageX, ArrowRight, ImageOff, FileText,
} from 'lucide-react'

export const ManagerDashboard = () => {
  const navigate = useNavigate()

  const { data: productsData, isLoading: productsLoading, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['products'],
    queryFn: async () => productsApi.getProducts({ limit: 200 }),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  const products: any[] = productsData?.products || []

  const stats = useMemo(() => {
    const total = products.length
    const low = products.filter((p) => p.stockStatus === 'low_stock').length
    const out = products.filter((p) => p.stockStatus === 'out_of_stock').length
    const active = products.filter((p) => p.status === 'active').length
    const stockValue = products.reduce((s, p) => s + (p.stock || 0) * (p.costPrice || 0), 0)
    return { total, low, out, active, stockValue }
  }, [products])

  const lowStockList = useMemo(
    () => products.filter((p) => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock').slice(0, 8),
    [products]
  )

  if (productsLoading) return <LoadingState message="Loading dashboard…" />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Live · updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
            {isFetching && <span className="ml-2 text-brand-600 animate-pulse">refreshing…</span>}
          </p>
        </div>
      </div>


      {/* Headline tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tile
          icon={Boxes}
          tone="brand"
          label="Total products"
          value={stats.total}
          hint={`${stats.active} active`}
          onClick={() => navigate('/manager/products')}
        />
        <Tile
          icon={PackageOpen}
          tone="amber"
          label="Low stock"
          value={stats.low}
          hint="Needs restock soon"
          onClick={() => navigate('/manager/inventory')}
        />
        <Tile
          icon={PackageX}
          tone="rose"
          label="Out of stock"
          value={stats.out}
          hint="Nothing to sell"
          onClick={() => navigate('/manager/inventory')}
        />
        <Tile
          icon={FileText}
          tone="sky"
          label="Stock value (cost)"
          value={`₹${stats.stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          hint={`Across ${stats.total} SKUs`}
          onClick={() => navigate('/manager/inventory')}
        />
      </div>

      {/* Low/out-of-stock hot list */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">Needs your attention</h3>
              <p className="text-xs text-gray-500 mt-0.5">Products low on or out of stock</p>
            </div>
            <button
              onClick={() => navigate('/manager/inventory')}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
            >
              Full inventory <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {lowStockList.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center mb-3">
                <Boxes className="h-5 w-5" />
              </div>
              <p className="font-semibold text-gray-900">Everything's well-stocked</p>
              <p className="text-sm text-gray-500 mt-1">No products are low or out of stock right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lowStockList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate('/manager/inventory')}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-50 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-surface-100 overflow-hidden grid place-items-center text-gray-400 flex-none">
                      {p.image ? (
                        <img src={getImageUrl(p.image)} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500">SKU · {p.SKU}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{p.stock} <span className="text-xs text-gray-500 font-normal">/ min {p.minimumStock}</span></p>
                    </div>
                    <Badge
                      dot
                      variant={p.stockStatus === 'out_of_stock' ? 'danger' : 'warning'}
                      className="capitalize"
                    >
                      {(p.stockStatus || '').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-display text-lg font-bold text-gray-900 mb-4">Product status</h3>
          <div className="space-y-3">
            <StatusRow tone="emerald" label="Active" value={stats.active} total={stats.total} />
            <StatusRow tone="gray" label="Inactive" value={stats.total - stats.active} total={stats.total} />
            <StatusRow tone="amber" label="Low stock" value={stats.low} total={stats.total} />
            <StatusRow tone="rose" label="Out of stock" value={stats.out} total={stats.total} />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

const Tile = ({
  icon: Icon, tone, label, value, hint, onClick,
}: {
  icon: any; tone: 'brand' | 'sky' | 'amber' | 'rose'; label: string; value: any; hint?: string; onClick?: () => void
}) => {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
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
    </button>
  )
}

const StatusRow = ({
  tone, label, value, total,
}: { tone: 'emerald' | 'gray' | 'amber' | 'rose'; label: string; value: number; total: number }) => {
  const pct = total ? Math.round((value / total) * 100) : 0
  const bar = {
    emerald: 'bg-emerald-500',
    gray: 'bg-gray-400',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }[tone]
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value} <span className="text-gray-500 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
