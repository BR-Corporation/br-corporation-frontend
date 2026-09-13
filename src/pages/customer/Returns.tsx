import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/tables/DataTable'
import { Badge } from '../../components/status/StatusBadge'
import { Button } from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { returnsApi } from '../../api'

const money = (n: any) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const statusVariant = (s: string) =>
  s === 'completed' ? 'success' :
  s === 'approved' ? 'info' :
  s === 'rejected' ? 'danger' :
  s === 'pending' ? 'warning' : 'default'

const statusLabel = (s: string) => {
  switch (s) {
    case 'pending': return 'Awaiting review'
    case 'approved': return 'Approved · awaiting completion'
    case 'completed': return 'Completed'
    case 'rejected': return 'Rejected'
    default: return s
  }
}

export const CustomerReturns = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const customerProfileId = user?.customerProfileId

  const { data, isLoading } = useQuery({
    queryKey: ['customerReturns', customerProfileId],
    queryFn: async () => {
      if (!customerProfileId) throw new Error('Customer profile not found')
      const response = await returnsApi.getCustomerReturns(customerProfileId)
      return response
    },
    enabled: !!customerProfileId,
    refetchInterval: 30_000,
  })

  const returns: any[] = data?.returns || []

  const columns = [
    {
      header: 'Return',
      key: 'id',
      render: (item: any) => (
        <div>
          <p className="font-medium">#{item.id.slice(-6)}</p>
          <p className="text-xs text-gray-500">Filed {new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      header: 'Order',
      key: 'orderId',
      render: (item: any) => `#${String(item.orderId?._id || item.orderId || '').slice(-6) || 'N/A'}`,
    },
    {
      header: 'Type',
      key: 'returnType',
      render: (item: any) => <Badge variant="default" className="capitalize">{item.returnType}</Badge>,
    },
    {
      header: 'Value',
      key: 'value',
      render: (item: any) => {
        const total = (item.items || []).reduce((s: number, i: any) => s + (i.lineTotal || 0), 0)
        return <span className="font-semibold text-gray-900">{money(total)}</span>
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (item: any) => (
        <Badge dot variant={statusVariant(item.status)} className="capitalize">{statusLabel(item.status)}</Badge>
      ),
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (item: any) => (
        <span className="truncate max-w-xs block text-sm text-gray-700">{item.reason}</span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item: any) => (
        <Button size="sm" onClick={() => navigate(`/customer/returns/${item.id}`)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Returns</h1>

      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4 text-sm text-brand-800">
        Open a return to see its progress, the items you returned, and whether a refund has been issued.
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={returns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No returns filed yet."
        />
      </div>
    </div>
  )
}
