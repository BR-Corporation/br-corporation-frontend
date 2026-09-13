import { useQuery } from '@tanstack/react-query'
import { DataTable } from '../../components/tables/DataTable'
import { Badge } from '../../components/status/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { paymentsApi } from '../../api'

export const CustomerPayments = () => {
  const { user } = useAuth()

  const customerProfileId = user?.customerProfileId

  const { data, isLoading } = useQuery({
    queryKey: ['customerPayments', customerProfileId],
    queryFn: async () => {
      if (!customerProfileId) throw new Error('Customer profile not found')
      const response = await paymentsApi.getCustomerPayments(customerProfileId)
      return response
    },
    enabled: !!customerProfileId,
    refetchInterval: 30_000,
  })

  const payments: any[] = data?.payments || []
  const netPaid = payments.reduce((s, p) => s + (p.type === 'refund' ? -p.amount : p.amount), 0)
  const refunded = payments.reduce((s, p) => s + (p.type === 'refund' ? p.amount : 0), 0)

  const columns = [
    {
      header: 'Payment',
      key: 'id',
      render: (item: any) => (
        <div>
          <p className="font-medium">#{item.id.slice(-6)}</p>
          <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      ),
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
        <span className={`font-semibold ${item.type === 'refund' ? 'text-rose-600' : 'text-emerald-600'}`}>
          {item.type === 'refund' ? '− ' : '+ '}₹{item.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Method',
      key: 'paymentMethod',
      render: (item: any) => <span className="capitalize">{item.paymentMethod?.replace('_', ' ')}</span>,
    },
    {
      header: 'Date',
      key: 'paymentDate',
      render: (item: any) => new Date(item.paymentDate).toLocaleDateString(),
    },
    {
      header: 'Reference',
      key: 'transactionReference',
      render: (item: any) => item.transactionReference || '—',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[var(--shadow-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net paid</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gray-900">
            ₹{netPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-gray-500">After all refunds</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[var(--shadow-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Refunded to you</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-rose-600">
            ₹{refunded.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-gray-500">Total returned</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[var(--shadow-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Transactions</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gray-900">{payments.length}</p>
          <p className="mt-1 text-xs text-gray-500">Payments and refunds combined</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={payments}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No payments or refunds yet."
        />
      </div>
    </div>
  )
}
