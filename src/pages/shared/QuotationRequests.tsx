import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { quotationRequestsApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/status/StatusBadge'
import { RequestQuotationModal } from '../../components/modals/RequestQuotationModal'
import { QuoteFromRequestModal } from '../../components/modals/QuoteFromRequestModal'
import { FileText, Send, ArrowRight } from 'lucide-react'

const statusLabel: Record<string, string> = {
  pending_salesperson: 'Awaiting salesperson',
  pending_manager: 'Awaiting manager',
  quoted: 'Quoted',
  rejected: 'Rejected',
}
const statusVariant: Record<string, any> = {
  pending_salesperson: 'warning',
  pending_manager: 'info',
  quoted: 'success',
  rejected: 'danger',
}

export const QuotationRequestsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [quoteReq, setQuoteReq] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quotationRequests'],
    queryFn: async () => quotationRequestsApi.list(),
    refetchInterval: 30_000,
  })
  const requests = data?.requests || []

  const forward = useMutation({
    mutationFn: (id: string) => quotationRequestsApi.forward(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotationRequests'] }),
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to forward.'),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => quotationRequestsApi.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotationRequests'] }),
  })

  const role = user?.role
  const rolePrefix = `/${role}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-brand-600" />
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {role === 'manager' ? 'Quotation requests' :
             role === 'customer' ? 'My quotation requests' :
             'Quotation requests'}
          </h1>
        </div>
        {role === 'customer' && (
          <Button onClick={() => setShowCreate(true)}>Request quotation</Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading…" />
      ) : requests.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">No quotation requests yet.</p>
            {role === 'customer' && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>Request your first quotation</Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {requests.map((r: any) => (
                <div key={r._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900">Request #{String(r._id).slice(-6)}</span>
                      <Badge dot variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {r.customerProfile?.businessName || '—'}
                      {r.customerProfile?.user?.Name && ` · ${r.customerProfile.user.Name}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.items?.length || 0} item(s) · created {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.notes && <p className="text-xs text-gray-600 mt-1 italic">"{r.notes}"</p>}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {r.quotation && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`${rolePrefix}/quotations/${r.quotation}`)}>
                        View quotation <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {role === 'salesperson' && r.status === 'pending_salesperson' && (
                      <Button
                        size="sm"
                        loading={forward.isPending && forward.variables === r._id}
                        onClick={() => forward.mutate(r._id)}
                      >
                        <Send className="h-3.5 w-3.5" /> Forward to manager
                      </Button>
                    )}
                    {role === 'manager' && r.status === 'pending_manager' && (
                      <Button size="sm" onClick={() => setQuoteReq(r)}>
                        Create quotation
                      </Button>
                    )}
                    {role === 'admin' && (r.status === 'pending_salesperson' || r.status === 'pending_manager') && (
                      <Button size="sm" onClick={() => setQuoteReq(r)}>
                        Create quotation
                      </Button>
                    )}
                    {(role === 'salesperson' || role === 'manager' || role === 'admin') &&
                     r.status !== 'quoted' && r.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          const reason = prompt('Reject reason (optional):') || ''
                          if (confirm('Reject this request?')) reject.mutate({ id: r._id, reason })
                        }}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {showCreate && user?.customerProfileId && (
        <RequestQuotationModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          customerProfileId={user.customerProfileId}
        />
      )}
      {quoteReq && (
        <QuoteFromRequestModal
          isOpen={!!quoteReq}
          onClose={() => setQuoteReq(null)}
          request={quoteReq}
        />
      )}
    </div>
  )
}
