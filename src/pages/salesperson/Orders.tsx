import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '../../components/tables/DataTable'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/status/StatusBadge'
import { useNavigate } from 'react-router-dom'
import { RecordPaymentModal } from '../../components/modals'
import { ordersApi } from '../../api'

export const SalespersonOrders = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => ordersApi.getOrders(),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] })
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to update order status.')
    },
  })

  const orders = data?.orders || []

  const statusVariant = (s: string) =>
    s === 'completed' ? 'success' :
    s === 'cancelled' ? 'danger' :
    s === 'processing' ? 'info' :
    s === 'confirmed' ? 'brand' : 'warning'

  const columns = [
    {
      header: 'Order',
      key: 'id',
      render: (item: any) => (
        <div>
          <p className="font-semibold text-gray-900">#{item.id.slice(-6)}</p>
          <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      key: 'customerProfile',
      render: (item: any) => item.customerProfile?.businessName || 'N/A',
    },
    {
      header: 'Total',
      key: 'grandTotal',
      render: (item: any) => `₹${item.grandTotal?.toLocaleString()}`,
    },
    {
      header: 'Status',
      key: 'orderStatus',
      render: (item: any) => (
        <Badge dot variant={statusVariant(item.orderStatus)} className="capitalize">{item.orderStatus}</Badge>
      ),
    },
    {
      header: 'Payment',
      key: 'paymentStatus',
      render: (item: any) => (
        <Badge variant={item.paymentStatus === 'paid' ? 'success' : item.paymentStatus === 'partial' ? 'warning' : 'default'} className="capitalize">
          {item.paymentStatus}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item: any) => {
        const busy = updateStatus.isPending && updateStatus.variables?.id === item.id
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/salesperson/orders/${item.id}`)}>View</Button>
            {item.orderStatus === 'pending' && (
              <>
                <Button
                  size="sm"
                  loading={busy && updateStatus.variables?.status === 'confirmed'}
                  onClick={() => updateStatus.mutate({ id: item.id, status: 'confirmed' })}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy && updateStatus.variables?.status === 'cancelled'}
                  onClick={() => updateStatus.mutate({ id: item.id, status: 'cancelled' })}
                >
                  Reject
                </Button>
              </>
            )}
            {item.orderStatus === 'confirmed' && (
              <Button
                size="sm"
                loading={busy && updateStatus.variables?.status === 'processing'}
                onClick={() => updateStatus.mutate({ id: item.id, status: 'processing' })}
              >
                Mark processing
              </Button>
            )}
            {item.orderStatus === 'processing' && (
              <Button
                size="sm"
                loading={busy && updateStatus.variables?.status === 'completed'}
                onClick={() => updateStatus.mutate({ id: item.id, status: 'completed' })}
              >
                Mark completed
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { setSelectedOrderId(item.id); setShowPaymentModal(true); }}>
              Payment
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Orders arrive when your customer accepts a quotation.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-soft)]">
        <DataTable
          columns={columns}
          data={orders}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No orders found"
        />
      </div>

      <RecordPaymentModal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setSelectedOrderId(''); }} orderId={selectedOrderId} />
    </div>
  )
}
