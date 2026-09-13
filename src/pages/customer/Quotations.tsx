import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/tables/DataTable'
import { Badge } from '../../components/status/StatusBadge'
import { Button } from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { quotationsApi } from '../../api'

export const CustomerQuotations = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const customerProfileId = user?.customerProfileId

  const { data, isLoading } = useQuery({
    queryKey: ['customerQuotations', customerProfileId],
    queryFn: async () => {
      if (!customerProfileId) throw new Error('Customer profile not found')
      const response = await quotationsApi.getCustomerQuotations(customerProfileId)
      return response
    },
    enabled: !!customerProfileId,
    refetchInterval: 30_000,
  })

  const quotations = data?.quotations || []

  const columns = [
    {
      header: 'Quotation',
      key: 'id',
      render: (item: any) => (
        <div>
          <p className="font-medium">#{item.id.slice(-6)}</p>
          <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      key: 'grandTotal',
      render: (item: any) => `₹${item.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    },
    {
      header: 'Status',
      key: 'status',
      render: (item: any) => {
        const variant =
          item.status === 'accepted' ? 'success' :
          item.status === 'rejected' ? 'danger' :
          item.status === 'converted' ? 'brand' :
          item.status === 'sent' ? 'info' : 'default'
        return <Badge dot variant={variant} className="capitalize">{item.status}</Badge>
      },
    },
    {
      header: 'Valid Until',
      key: 'validUntil',
      render: (item: any) => (item.validUntil ? new Date(item.validUntil).toLocaleDateString() : '—'),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item: any) => (
        <Button size="sm" onClick={() => navigate(`/customer/quotations/${item.id}`)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Quotations</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={quotations}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No quotations yet. Send a quotation request to your salesperson to get started."
        />
      </div>
    </div>
  )
}
