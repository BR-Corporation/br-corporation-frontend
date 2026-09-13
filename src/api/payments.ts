import apiClient from './client'

export interface Payment {
  id: string
  customerProfileId: string
  orderId: string
  amount: number
  paymentMethod: string
  paymentDate: string
  transactionReference?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const paymentsApi = {
  createPayment: async (data: {
    orderId: string
    amount: number
    paymentMethod: string
    paymentDate?: string
    transactionReference?: string
    notes?: string
  }) => {
    const response = await apiClient.post('/payments/', data)
    return response.data
  },

  getPayments: async (params?: {
    page?: number
    limit?: number
    customerProfileId?: string
    orderId?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
    sort?: string
  }) => {
    const response = await apiClient.get('/payments/', { params })
    return response.data
  },

  getCustomerPayments: async (customerProfileId: string) => {
    const response = await apiClient.get(`/payments/customer/${customerProfileId}`)
    return response.data
  },

  getOrderPayments: async (orderId: string) => {
    const response = await apiClient.get(`/payments/order/${orderId}`)
    return response.data
  },

  deletePayment: async (paymentId: string) => {
    const response = await apiClient.delete(`/payments/${paymentId}`)
    return response.data
  },

  recordRefund: async (data: {
    orderId: string
    amount: number
    paymentMethod: string
    paymentDate?: string
    transactionReference?: string
    notes?: string
    orderReturnId?: string
  }) => {
    const response = await apiClient.post('/payments/refund', data)
    return response.data
  },
}
