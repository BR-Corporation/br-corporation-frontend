import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { ordersApi, customersApi, productsApi } from '../../api'
import type { Customer } from '../../types'

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateOrderModal = ({ isOpen, onClose }: CreateOrderModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    customerProfileId: '',
    items: [{ product: '', quantity: 1, discount: 0, tax: 0 }],
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      customersApi.getCustomers().then((res) => setCustomers(res.customers || []))
      productsApi.getProducts().then((res) => setProducts(res.products || []))
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await ordersApi.createOrder(formData)
      onClose()
      setFormData({ customerProfileId: '', items: [{ product: '', quantity: 1, discount: 0, tax: 0 }], notes: '' })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, discount: 0, tax: 0 }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'product') {
      const picked = products.find((p) => p.id === value)
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.businessName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Items</label>
            <Button type="button" size="sm" variant="ghost" onClick={addItem}>
              Add Item
            </Button>
          </div>
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-5">
                <select
                  value={item.product}
                  onChange={(e) => updateItem(index, 'product', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.sellingPrice}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Discount %"
                  value={item.discount}
                  onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Tax %"
                  value={item.tax}
                  onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-1 flex items-center">
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800">
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create Order
        </Button>
      </form>
    </Modal>
  )
}
