import { useState, useEffect, useMemo } from 'react'
import { Modal } from './Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { ordersApi, customersApi, productsApi } from '../../api'
import type { Customer } from '../../types'

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Row {
  product: string
  quantity: number
  discount: number
  tax: number
}

const emptyRow: Row = { product: '', quantity: 1, discount: 0, tax: 0 }

export const CreateOrderModal = ({ isOpen, onClose }: CreateOrderModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerProfileId: '',
    items: [{ ...emptyRow }],
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setCustomersLoading(true)
    customersApi.getCustomers({ limit: 200 })
      .then((res) => setCustomers(res.customers || []))
      .finally(() => setCustomersLoading(false))
    productsApi.getProducts({ limit: 200 }).then((res) => setProducts(res.products || []))
  }, [isOpen])

  const productById = useMemo(() => {
    const m = new Map<string, any>()
    for (const p of products) m.set(p.id, p)
    return m
  }, [products])

  const totals = useMemo(() => {
    let subtotal = 0, discount = 0, tax = 0
    for (const it of formData.items) {
      const p = productById.get(it.product)
      if (!p) continue
      const qty = Number(it.quantity) || 0
      const line = qty * (p.sellingPrice || 0)
      const d = line * ((Number(it.discount) || 0) / 100)
      const t = (line - d) * ((Number(it.tax) || 0) / 100)
      subtotal += line
      discount += d
      tax += t
    }
    return { subtotal, discount, tax, grand: subtotal - discount + tax }
  }, [formData.items, productById])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await ordersApi.createOrder(formData)
      onClose()
      setFormData({ customerProfileId: '', items: [{ ...emptyRow }], notes: '' })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { ...emptyRow }] })
  const removeItem = (index: number) =>
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })

  const updateItem = (index: number, field: keyof Row, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'product') {
      const picked = productById.get(value)
      if (picked) newItems[index].tax = picked.tax ?? 0
    }
    setFormData({ ...formData, items: newItems })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select
            value={formData.customerProfileId}
            onChange={(e) => setFormData({ ...formData, customerProfileId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            required
            disabled={customersLoading || customers.length === 0}
          >
            <option value="">
              {customersLoading
                ? 'Loading customers…'
                : customers.length === 0
                ? 'No customers assigned to you yet'
                : 'Select Customer'}
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.businessName}
              </option>
            ))}
          </select>
          {!customersLoading && customers.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              Ask admin to assign a customer to you before creating orders.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Items</label>
            <Button type="button" size="sm" variant="ghost" onClick={addItem}>
              Add Item
            </Button>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 gap-2 mb-1 px-1">
            <div className="col-span-5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Product</div>
            <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Qty</div>
            <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Discount %</div>
            <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tax %</div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-3 sm:space-y-2">
            {formData.items.map((item, index) => {
              const p = productById.get(item.product)
              const qty = Number(item.quantity) || 0
              const line = p ? qty * (p.sellingPrice || 0) : 0
              const dAmt = line * ((Number(item.discount) || 0) / 100)
              const tAmt = (line - dAmt) * ((Number(item.tax) || 0) / 100)
              const lineTotal = line - dAmt + tAmt
              return (
                <div key={index} className="rounded-lg border border-gray-100 sm:border-0 p-2 sm:p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="sm:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Product</label>
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(index, 'product', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} — ₹{product.sellingPrice}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Discount %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Tax %</label>
                      <input
                        type="number"
                        min={0}
                        value={item.tax}
                        onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-center justify-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-xl leading-none px-2"
                          aria-label="Remove item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  {p && (
                    <div className="mt-1 flex justify-end text-[11px] text-gray-500 gap-3">
                      <span>Line: ₹{line.toFixed(2)}</span>
                      {dAmt > 0 && <span>− ₹{dAmt.toFixed(2)}</span>}
                      {tAmt > 0 && <span>+ tax ₹{tAmt.toFixed(2)}</span>}
                      <span className="font-semibold text-gray-800">= ₹{lineTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Totals summary */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="text-rose-600">− ₹{totals.discount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>₹{totals.tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-1 mt-1"><span>Grand total</span><span>₹{totals.grand.toFixed(2)}</span></div>
        </div>

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <Button type="submit" className="w-full" loading={loading} disabled={customers.length === 0}>
          Create Order
        </Button>
      </form>
    </Modal>
  )
}
