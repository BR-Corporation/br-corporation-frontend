import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/status/StatusBadge'
import { reportsApi } from '../../api'
import {
  IndianRupee, ShoppingCart, Users, Package, Boxes, Wallet,
  Download, TrendingUp, PackageX, PackageOpen, Calendar,
} from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

type Section = 'overview' | 'sales' | 'customers' | 'products' | 'inventory' | 'payments'

const toCsv = (rows: any[], columns: { key: string; header: string }[]) => {
  if (!rows.length) return ''
  const head = columns.map((c) => `"${c.header}"`).join(',')
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = r[c.key]
      const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }).join(',')
  ).join('\n')
  return `${head}\n${body}`
}

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const defaultRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export const AdminReports = () => {
  const navigate = useNavigate()
  const [{ start, end }, setRange] = useState(defaultRange())
  const [section, setSection] = useState<Section>('overview')

  const params = { startDate: start, endDate: end }

  const sales = useQuery({
    queryKey: ['reports:sales', start, end],
    queryFn: () => reportsApi.getSalesReport(params),
  })
  const customers = useQuery({
    queryKey: ['reports:customers'],
    queryFn: () => reportsApi.getCustomerReport(),
  })
  const products = useQuery({
    queryKey: ['reports:products'],
    queryFn: () => reportsApi.getProductReport(),
  })
  const inventory = useQuery({
    queryKey: ['reports:inventory'],
    queryFn: () => reportsApi.getInventoryReport(),
  })
  const payments = useQuery({
    queryKey: ['reports:payments', start, end],
    queryFn: () => reportsApi.getPaymentReport(params),
  })

  const isLoading = sales.isLoading && customers.isLoading && products.isLoading && inventory.isLoading && payments.isLoading

  const s = sales.data?.report || {}
  const c = customers.data?.report || {}
  const p = products.data?.report || {}
  const i = inventory.data?.report || {}
  const pay = payments.data?.report || {}

  const totalCustomers = c.totalCustomers || (c.customers || []).length
  const newCustomers = (c.customers || []).filter((x: any) => x.customerStage === 'new').length
  const activeCustomers = (c.customers || []).filter((x: any) => x.customerStage && x.customerStage !== 'new' && x.customerStage !== 'lost').length

  const salesByDate: any[] = s.salesByDate || []
  const salesByProduct: any[] = s.salesByProduct || []
  const salesBySalesperson: any[] = s.salesBySalesperson || []
  const salesByCustomer: any[] = s.salesByCustomer || []
  const bestSelling: any[] = i.bestSellingProducts || []
  const paymentsList: any[] = pay.payments || []

  const maxDayRev = useMemo(() => Math.max(1, ...salesByDate.map((d: any) => d.sales ?? d.totalRevenue ?? 0)), [salesByDate])
  const maxSpRev  = useMemo(() => Math.max(1, ...salesBySalesperson.map((d: any) => d.sales ?? d.totalRevenue ?? 0)), [salesBySalesperson])

  const setPreset = (days: number) => {
    const e = new Date()
    const startD = new Date()
    startD.setDate(e.getDate() - days)
    setRange({ start: startD.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) })
  }

  if (isLoading) return <LoadingState message="Loading reports…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Business performance across sales, customers, inventory and payments.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={start}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              className="text-sm outline-none"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className="text-sm outline-none"
            />
          </div>
          <div className="flex gap-1">
            <button onClick={() => setPreset(7)} className="text-xs px-3 py-2 rounded-full bg-surface-100 hover:bg-surface-200">7d</button>
            <button onClick={() => setPreset(30)} className="text-xs px-3 py-2 rounded-full bg-surface-100 hover:bg-surface-200">30d</button>
            <button onClick={() => setPreset(90)} className="text-xs px-3 py-2 rounded-full bg-surface-100 hover:bg-surface-200">90d</button>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 -mx-1 px-1 overflow-x-auto">
        {(['overview','sales','customers','products','inventory','payments'] as Section[]).map((k) => (
          <button
            key={k}
            onClick={() => setSection(k)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
              section === k
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile icon={IndianRupee} tone="emerald" label="Revenue" value={money(s.totalSales)} hint={`AOV ${money(s.averageOrderValue)}`} onClick={() => setSection('sales')} />
            <StatTile icon={ShoppingCart} tone="sky" label="Orders" value={s.totalOrders ?? 0} onClick={() => navigate('/admin/orders')} />
            <StatTile icon={Wallet} tone="amber" label="Collected" value={money(pay.totalCollected)} hint={`Outstanding ${money(pay.totalOutstanding)}`} onClick={() => navigate('/admin/payments')} />
            <StatTile icon={Users} tone="brand" label="Customers" value={totalCustomers} hint={`${newCustomers} new · ${activeCustomers} active`} onClick={() => navigate('/admin/customers')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardBody>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-3">Sales trend</h3>
                {salesByDate.length === 0 ? (
                  <EmptyRow msg="No sales in this period." />
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {salesByDate.slice(-14).map((d: any) => {
                      const rev = d.sales ?? d.totalRevenue ?? 0
                      return (
                        <div key={d._id} className="grid grid-cols-12 items-center gap-2 text-sm">
                          <span className="col-span-3 text-xs text-gray-500">{d._id}</span>
                          <div className="col-span-6 h-2 rounded-full bg-surface-100 overflow-hidden">
                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(rev / maxDayRev) * 100}%` }} />
                          </div>
                          <span className="col-span-3 text-right font-semibold text-gray-900">{money(rev)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-3">Top salespeople</h3>
                {salesBySalesperson.length === 0 ? (
                  <EmptyRow msg="No sales attributed yet." />
                ) : (
                  <div className="space-y-2">
                    {salesBySalesperson.slice(0, 8).map((sp: any) => {
                      const rev = sp.sales ?? sp.totalRevenue ?? 0
                      return (
                        <div key={sp._id} className="grid grid-cols-12 items-center gap-2 text-sm">
                          <span className="col-span-4 truncate">{sp.salespersonName || '—'}</span>
                          <div className="col-span-5 h-2 rounded-full bg-surface-100 overflow-hidden">
                            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(rev / maxSpRev) * 100}%` }} />
                          </div>
                          <span className="col-span-3 text-right font-semibold text-gray-900">{money(rev)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-3">Best-selling products</h3>
                {bestSelling.length === 0 ? (
                  <EmptyRow msg="No product sales yet." />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {bestSelling.map((b: any, idx: number) => (
                      <li key={b.productId || idx} className="py-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{idx + 1}. {b.productName}</span>
                        <span className="text-gray-500">{b.totalQuantity} sold · <span className="font-semibold text-gray-900">{money(b.totalRevenue)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-3">Inventory snapshot</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <MiniStat icon={Boxes} tone="brand" label="Products" value={i.totalProducts ?? p.totalProducts ?? 0} />
                  <MiniStat icon={PackageOpen} tone="amber" label="Low stock" value={(i.lowStockProducts || []).length ?? 0} />
                  <MiniStat icon={PackageX} tone="rose" label="Out of stock" value={(i.outOfStockProducts || []).length ?? 0} />
                </div>
                <p className="text-xs text-gray-500 mt-3">Inventory movements (period): <span className="font-semibold text-gray-900">{(i.inventoryMovements || []).length}</span></p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* SALES */}
      {section === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={IndianRupee} tone="emerald" label="Total sales" value={money(s.totalSales)} onClick={() => navigate('/admin/orders')} />
            <StatTile icon={ShoppingCart} tone="sky" label="Orders" value={s.totalOrders ?? 0} onClick={() => navigate('/admin/orders')} />
            <StatTile icon={TrendingUp} tone="brand" label="AOV" value={money(s.averageOrderValue)} />
          </div>

          <Card>
            <CardBody>
              <SectionHeader title="Sales by day" onExport={() =>
                downloadCsv(`sales-by-day_${start}_${end}.csv`, toCsv(
                  salesByDate.map((d: any) => ({ date: d._id, revenue: d.sales ?? d.totalRevenue, orders: d.orders ?? d.totalOrders })),
                  [{ key: 'date', header: 'Date' }, { key: 'revenue', header: 'Revenue' }, { key: 'orders', header: 'Orders' }]
                ))
              } />
              <SimpleTable
                columns={[{ h: 'Date' }, { h: 'Orders', align: 'right' }, { h: 'Revenue', align: 'right' }]}
                rows={salesByDate.map((d: any) => [d._id, d.orders ?? d.totalOrders ?? 0, money(d.sales ?? d.totalRevenue)])}
                empty="No sales in this range."
              />
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardBody>
                <SectionHeader title="By salesperson" onExport={() =>
                  downloadCsv(`sales-by-sp_${start}_${end}.csv`, toCsv(
                    salesBySalesperson.map((r: any) => ({ name: r.salespersonName, orders: r.orders ?? r.totalOrders, revenue: r.sales ?? r.totalRevenue })),
                    [{ key: 'name', header: 'Salesperson' }, { key: 'orders', header: 'Orders' }, { key: 'revenue', header: 'Revenue' }]
                  ))
                } />
                <SimpleTable
                  columns={[{ h: 'Salesperson' }, { h: 'Orders', align: 'right' }, { h: 'Revenue', align: 'right' }]}
                  rows={salesBySalesperson.map((r: any) => [r.salespersonName || '—', r.orders ?? r.totalOrders ?? 0, money(r.sales ?? r.totalRevenue)])}
                  empty="No data."
                />
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeader title="By customer (top)" onExport={() =>
                  downloadCsv(`sales-by-customer_${start}_${end}.csv`, toCsv(
                    salesByCustomer.map((r: any) => ({ name: r.customerName ?? r.customerBusinessName, orders: r.orders ?? r.totalOrders, revenue: r.sales ?? r.totalRevenue })),
                    [{ key: 'name', header: 'Customer' }, { key: 'orders', header: 'Orders' }, { key: 'revenue', header: 'Revenue' }]
                  ))
                } />
                <SimpleTable
                  columns={[{ h: 'Customer' }, { h: 'Orders', align: 'right' }, { h: 'Revenue', align: 'right' }]}
                  rows={salesByCustomer.slice(0, 15).map((r: any) => [r.customerName ?? r.customerBusinessName ?? '—', r.orders ?? r.totalOrders ?? 0, money(r.sales ?? r.totalRevenue)])}
                  empty="No data."
                />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <SectionHeader title="By product" onExport={() =>
                downloadCsv(`sales-by-product_${start}_${end}.csv`, toCsv(
                  salesByProduct.map((r: any) => ({ name: r.productName, qty: r.quantity ?? r.totalQuantity, revenue: r.revenue ?? r.totalRevenue })),
                  [{ key: 'name', header: 'Product' }, { key: 'qty', header: 'Qty' }, { key: 'revenue', header: 'Revenue' }]
                ))
              } />
              <SimpleTable
                columns={[{ h: 'Product' }, { h: 'Qty', align: 'right' }, { h: 'Revenue', align: 'right' }]}
                rows={salesByProduct.slice(0, 25).map((r: any) => [r.productName || '—', r.quantity ?? r.totalQuantity ?? 0, money(r.revenue ?? r.totalRevenue)])}
                empty="No product data."
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* CUSTOMERS */}
      {section === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={Users} tone="brand" label="Total customers" value={totalCustomers} onClick={() => navigate('/admin/customers')} />
            <StatTile icon={Users} tone="emerald" label="New" value={newCustomers} onClick={() => navigate('/admin/customers?stage=new')} />
            <StatTile icon={Users} tone="sky" label="Active" value={activeCustomers} onClick={() => navigate('/admin/customers')} />
          </div>
          <Card>
            <CardBody>
              <SectionHeader title="All customers" onExport={() =>
                downloadCsv(`customers.csv`, toCsv(c.customers || [], [
                  { key: 'businessName', header: 'Business' }, { key: 'customerStage', header: 'Stage' },
                  { key: 'city', header: 'City' }, { key: 'totalOrders', header: 'Orders' },
                  { key: 'totalRevenue', header: 'Revenue' }, { key: 'outstandingAmount', header: 'Outstanding' },
                ]))
              } />
              <SimpleTable
                columns={[{ h: 'Business' }, { h: 'Stage' }, { h: 'City' }, { h: 'Orders', align: 'right' }, { h: 'Revenue', align: 'right' }, { h: 'Outstanding', align: 'right' }]}
                rows={(c.customers || []).slice(0, 100).map((r: any) => [
                  r.businessName || '—',
                  <Badge key="s" variant="default" className="capitalize">{r.customerStage || '—'}</Badge>,
                  r.city || '—',
                  r.totalOrders || 0,
                  money(r.totalRevenue),
                  money(r.outstandingAmount),
                ])}
                empty="No customers."
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* PRODUCTS */}
      {section === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatTile icon={Package} tone="brand" label="Total products" value={p.totalProducts ?? (p.products || []).length} onClick={() => navigate('/admin/products')} />
            <StatTile icon={Boxes} tone="amber" label="Active" value={(p.products || []).filter((x: any) => x.status === 'active').length} onClick={() => navigate('/admin/products')} />
          </div>
          <Card>
            <CardBody>
              <SectionHeader title="Products" onExport={() =>
                downloadCsv(`products.csv`, toCsv(p.products || [], [
                  { key: 'name', header: 'Name' }, { key: 'SKU', header: 'SKU' }, { key: 'category', header: 'Category' },
                  { key: 'sellingPrice', header: 'Price' }, { key: 'stock', header: 'Stock' }, { key: 'status', header: 'Status' },
                ]))
              } />
              <SimpleTable
                columns={[{ h: 'Name' }, { h: 'SKU' }, { h: 'Category' }, { h: 'Price', align: 'right' }, { h: 'Stock', align: 'right' }, { h: 'Status' }]}
                rows={(p.products || []).map((r: any) => [
                  r.name, r.SKU, r.category, money(r.sellingPrice), r.stock,
                  <Badge key="s" variant={r.status === 'active' ? 'success' : 'default'} className="capitalize">{r.status}</Badge>,
                ])}
                empty="No products."
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* INVENTORY */}
      {section === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={Boxes} tone="brand" label="Products" value={i.totalProducts ?? 0} onClick={() => navigate('/admin/inventory')} />
            <StatTile icon={PackageOpen} tone="amber" label="Low stock" value={(i.lowStockProducts || []).length} onClick={() => navigate('/admin/inventory')} />
            <StatTile icon={PackageX} tone="rose" label="Out of stock" value={(i.outOfStockProducts || []).length} onClick={() => navigate('/admin/inventory')} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardBody>
                <SectionHeader title="Low stock" />
                <SimpleTable
                  columns={[{ h: 'Product' }, { h: 'SKU' }, { h: 'Stock', align: 'right' }]}
                  rows={(i.lowStockProducts || []).map((r: any) => [r.name, r.SKU, r.stock])}
                  empty="All good."
                />
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <SectionHeader title="Out of stock" />
                <SimpleTable
                  columns={[{ h: 'Product' }, { h: 'SKU' }]}
                  rows={(i.outOfStockProducts || []).map((r: any) => [r.name, r.SKU])}
                  empty="Nothing out of stock."
                />
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardBody>
              <SectionHeader title="Best-selling" />
              <SimpleTable
                columns={[{ h: 'Product' }, { h: 'Qty sold', align: 'right' }, { h: 'Revenue', align: 'right' }]}
                rows={bestSelling.map((r: any) => [r.productName, r.totalQuantity, money(r.totalRevenue)])}
                empty="No sales."
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* PAYMENTS */}
      {section === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatTile icon={Wallet} tone="emerald" label="Collected" value={money(pay.totalCollected)} onClick={() => navigate('/admin/payments')} />
            <StatTile icon={IndianRupee} tone="amber" label="Outstanding" value={money(pay.totalOutstanding)} onClick={() => navigate('/admin/orders?paymentStatus=unpaid')} />
            <StatTile icon={ShoppingCart} tone="sky" label="Payments" value={pay.totalPayments ?? 0} onClick={() => navigate('/admin/payments')} />
            <StatTile icon={TrendingUp} tone="rose" label="Overdue orders" value={pay.overduePayments ?? 0} onClick={() => navigate('/admin/orders?paymentStatus=unpaid')} />
          </div>
          <Card>
            <CardBody>
              <SectionHeader title="Recent payments" onExport={() =>
                downloadCsv(`payments_${start}_${end}.csv`, toCsv(paymentsList, [
                  { key: 'paymentDate', header: 'Date' }, { key: 'amount', header: 'Amount' },
                  { key: 'paymentMethod', header: 'Method' }, { key: 'transactionReference', header: 'Reference' },
                ]))
              } />
              <SimpleTable
                columns={[{ h: 'Date' }, { h: 'Amount', align: 'right' }, { h: 'Method' }, { h: 'Reference' }]}
                rows={paymentsList.slice(0, 100).map((r: any) => [
                  new Date(r.paymentDate || r.createdAt).toLocaleDateString(),
                  money(r.amount),
                  <Badge key="m" variant="info" className="capitalize">{(r.paymentMethod || '').replace('_', ' ')}</Badge>,
                  r.transactionReference || '—',
                ])}
                empty="No payments recorded in this range."
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}

const StatTile = ({ icon: Icon, tone, label, value, hint, onClick }: { icon: any; tone: 'brand' | 'sky' | 'emerald' | 'amber' | 'rose'; label: string; value: any; hint?: string; onClick?: () => void }) => {
  const tones: any = {
    brand: 'bg-brand-50 text-brand-700',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  const inner = (
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 font-display text-2xl font-extrabold text-gray-900 truncate">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-500 truncate">{hint}</p>}
      </div>
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  )
  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
        {inner}
      </button>
    )
  }
  return <div className="rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-soft)] p-5">{inner}</div>
}

const MiniStat = ({ icon: Icon, tone, label, value }: { icon: any; tone: 'brand' | 'amber' | 'rose'; label: string; value: any }) => {
  const tones: any = { brand: 'text-brand-700 bg-brand-50', amber: 'text-amber-700 bg-amber-50', rose: 'text-rose-700 bg-rose-50' }
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className={`mx-auto h-8 w-8 rounded-lg grid place-items-center mb-1 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  )
}

const SectionHeader = ({ title, onExport }: { title: string; onExport?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
    {onExport && (
      <Button size="sm" variant="ghost" onClick={onExport}>
        <Download className="h-3.5 w-3.5" /> Export CSV
      </Button>
    )}
  </div>
)

const SimpleTable = ({ columns, rows, empty }: { columns: { h: string; align?: 'left' | 'right' }[]; rows: any[][]; empty: string }) => {
  if (rows.length === 0) return <EmptyRow msg={empty} />
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
            {columns.map((c, ci) => (
              <th key={ci} className={`py-2 pr-4 ${c.align === 'right' ? 'text-right' : ''}`}>{c.h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci} className={`py-2 pr-4 ${columns[ci]?.align === 'right' ? 'text-right' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const EmptyRow = ({ msg }: { msg: string }) => (
  <p className="text-sm text-gray-500 text-center py-6">{msg}</p>
)
