import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/tables/DataTable'
import { Card, CardBody } from '../../components/common/Card'
import { Badge } from '../../components/status/StatusBadge'
import { Button } from '../../components/common/Button'
import { paymentsApi } from '../../api'
import { useQueryClient } from '@tanstack/react-query'
import { RecordRefundModal } from '../../components/modals'
import { IndianRupee, TrendingUp, Wallet, Search, Undo2 } from 'lucide-react'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export const AdminPayments = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [method, setMethod] = useState<string>('')

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to delete payment.'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => paymentsApi.getPayments({ limit: 200 }),
    refetchOnWindowFocus: true,
  })

  const payments: any[] = data?.payments || []
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null)

  const stats = useMemo(() => {
    let received = 0, refunded = 0
    const byMethod: Record<string, number> = {}
    payments.forEach((p) => {
      const amt = p.amount || 0
      if (p.type === 'refund') refunded += amt
      else received += amt
      const k = p.paymentMethod || 'other'
      byMethod[k] = (byMethod[k] || 0) + (p.type === 'refund' ? -amt : amt)
    })
    return { total: received - refunded, received, refunded, count: payments.length, byMethod }
  }, [payments])

  const methods = useMemo(() => Object.keys(stats.byMethod), [stats])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter((p) => {
      if (method && p.paymentMethod !== method) return false
      if (!q) return true
      const cp = p.customerProfileId
      return (
        cp?.businessName?.toLowerCase().includes(q) ||
        p.transactionReference?.toLowerCase().includes(q) ||
        String(p.id).slice(-6).includes(q) ||
        String(p.orderId?._id || p.orderId).slice(-6).includes(q)
      )
    })
  }, [payments, query, method])

  const columns = [
    {
      header: 'Payment',
      key: 'id',
      render: (item: any) => (
        <div>
          <p className="font-semibold text-gray-900">#{String(item.id).slice(-6)}</p>
          <p className="text-[11px] text-gray-500">{new Date(item.paymentDate || item.createdAt).toLocaleString()}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (item: any) => (
        <div>
          <p className="font-medium text-gray-900">{item.customerProfileId?.businessName || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Order',
      key: 'order',
      render: (item: any) => {
        const oid = item.orderId?._id || item.orderId
        return oid ? (
          <button
            className="text-brand-700 hover:underline text-sm"
            onClick={() => navigate(`/admin/orders/${oid}`)}
          >
            #{String(oid).slice(-6)}
          </button>
        ) : '—'
      },
    },
    {
      header: 'Type',
      key: 'type',
      render: (item: any) => (
        item.type === 'refund'
          ? <Badge variant="warning">Refund</Badge>
          : <Badge variant="success">Payment</Badge>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (item: any) => (
        <span className={`font-semibold ${item.type === 'refund' ? 'text-rose-600' : 'text-emerald-700'}`}>
          {item.type === 'refund' ? '− ' : ''}{money(item.amount)}
        </span>
      ),
    },
    {
      header: 'Method',
      key: 'paymentMethod',
      render: (item: any) => <Badge variant="info" className="capitalize">{(item.paymentMethod || '').replace('_', ' ')}</Badge>,
    },
    {
      header: 'Reference',
      key: 'transactionReference',
      render: (item: any) => item.transactionReference || <span className="text-gray-400">—</span>,
    },
    {
      header: 'Received by',
      key: 'createdBy',
      render: (item: any) => item.createdBy?.Name || '—',
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item: any) => {
        const oid = item.orderId?._id || item.orderId
        return (
          <div className="flex gap-2">
            {item.type !== 'refund' && oid && (
              <Button size="sm" variant="outline" onClick={() => setRefundOrderId(String(oid))}>
                <Undo2 className="h-3.5 w-3.5" /> Refund
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={deleteMutation.isPending && deleteMutation.variables === item.id}
              onClick={() => {
                if (confirm(`Delete this ${item.type === 'refund' ? 'refund' : 'payment'} of ₹${item.amount?.toLocaleString()}? Order totals will be reversed.`)) {
                  deleteMutation.mutate(item.id)
                }
              }}
            >
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Payments received</h1>
        <p className="text-sm text-gray-500 mt-1">All payments received from customers, structured by method and time.</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card hover>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net collected</p>
                <p className="mt-2 font-display text-2xl font-bold text-gray-900">{money(stats.total)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Received {money(stats.received)}
                  {stats.refunded > 0 && <> · refunded <span className="text-rose-600 font-semibold">{money(stats.refunded)}</span></>}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card hover>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">By method</p>
            <div className="flex flex-wrap gap-2">
              {methods.length === 0 && <p className="text-sm text-gray-500">No payments yet.</p>}
              {methods.map((m) => (
                <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-surface-100 text-gray-700">
                  <span className="capitalize">{m.replace('_', ' ')}</span>: <span className="font-semibold">{money(stats.byMethod[m])}</span>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card hover>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest payment</p>
                <p className="mt-2 font-display text-lg font-bold text-gray-900">
                  {payments[0] ? money(payments[0].amount) : '—'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {payments[0]
                    ? `${payments[0].customerProfileId?.businessName || '—'} · ${new Date(payments[0].paymentDate || payments[0].createdAt).toLocaleDateString()}`
                    : 'Nothing recorded yet'}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters + table */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h3 className="font-display text-lg font-bold text-gray-900 inline-flex items-center gap-2">
              <Wallet className="h-5 w-5 text-brand-600" />
              All payments ({filtered.length})
            </h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer, order, ref…"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
                />
              </div>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
              >
                <option value="">All methods</option>
                {methods.map((m) => (
                  <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders?paymentStatus=unpaid')}>
                See outstanding
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No payments found"
          />
        </CardBody>
      </Card>

      {refundOrderId && (
        <RecordRefundModal
          isOpen={!!refundOrderId}
          onClose={() => setRefundOrderId(null)}
          orderId={refundOrderId}
        />
      )}
    </div>
  )
}
