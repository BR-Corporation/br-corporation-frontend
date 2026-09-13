import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from './Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { paymentsApi } from '../../api'

interface RecordRefundModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderReturnId?: string
  suggestedAmount?: number
  outstandingPaid?: number
}

export const RecordRefundModal = ({
  isOpen,
  onClose,
  orderId,
  orderReturnId,
  suggestedAmount,
  outstandingPaid,
}: RecordRefundModalProps) => {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [transactionReference, setTransactionReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setAmount(suggestedAmount != null ? String(suggestedAmount) : '')
      setPaymentMethod('bank_transfer')
      setTransactionReference('')
      setNotes('')
      setError('')
    }
  }, [isOpen, suggestedAmount])

  const submit = useMutation({
    mutationFn: () =>
      paymentsApi.recordRefund({
        orderId,
        amount: parseFloat(amount),
        paymentMethod,
        transactionReference,
        notes,
        orderReturnId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['customerPayments'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['return'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })
      onClose()
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to record refund.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const n = parseFloat(amount)
    if (!n || n <= 0) { setError('Enter a valid amount.'); return }
    submit.mutate()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Refund" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">{error}</div>}

        {outstandingPaid != null && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700">
            Net paid on this order so far: <span className="font-semibold">₹{outstandingPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>.
            You can refund up to that amount.
          </div>
        )}

        <Input
          label="Refund amount (₹)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Refund method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Input
          label="Transaction reference (optional)"
          value={transactionReference}
          onChange={(e) => setTransactionReference(e.target.value)}
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submit.isPending}>Record refund</Button>
        </div>
      </form>
    </Modal>
  )
}
