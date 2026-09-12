import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dashboardsApi } from '../../api'
import { LoadingState } from '../../components/common/LoadingState'
import { Card, CardBody } from '../../components/common/Card'
import { ShoppingCart, FileText, Users, PhoneCall } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const SalespersonDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['salespersonDashboard', user?.id],
    queryFn: async () => {
      const response = await dashboardsApi.getSalespersonDashboard(user!.id)
      return response.dashboard
    },
    enabled: !!user?.id,
  })

  if (isLoading) return <LoadingState message="Loading dashboard..." />

  const dashboard = data || {}

  const tiles = [
    {
      to: '/salesperson/customers',
      icon: Users,
      color: 'text-blue-600',
      label: 'Assigned Customers',
      value: dashboard.crm?.totalCustomers || 0,
    },
    {
      to: '/salesperson/quotations',
      icon: FileText,
      color: 'text-green-600',
      label: 'Quotations',
      value: dashboard.quotations?.created || 0,
    },
    {
      to: '/salesperson/orders',
      icon: ShoppingCart,
      color: 'text-purple-600',
      label: 'Orders',
      value: dashboard.orders?.created || 0,
    },
    {
      to: '/salesperson/customers',
      icon: PhoneCall,
      color: 'text-orange-600',
      label: 'Overdue Follow-ups',
      value: dashboard.followUps?.overdue || 0,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Salesperson Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => navigate(t.to)}
            className="text-left focus:outline-none focus:ring-2 focus:ring-brand-400 rounded-2xl"
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardBody>
                <div className="flex items-center gap-3">
                  <t.icon className={`h-8 w-8 ${t.color}`} />
                  <div>
                    <p className="text-sm text-gray-600">{t.label}</p>
                    <p className="text-2xl font-bold">{t.value}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
