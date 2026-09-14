import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { MainLayout } from '../layouts/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleIndexRedirect } from './RoleIndexRedirect'
import { OrderDetailPage } from '../pages/shared/OrderDetail'
import { ProductDetailPage } from '../pages/shared/ProductDetail'
import { QuotationDetailPage } from '../pages/shared/QuotationDetail'
import { ReturnDetailPage } from '../pages/shared/ReturnDetail'
import { MessagesPage } from '../pages/shared/Messages'
import { QuotationRequestsPage } from '../pages/shared/QuotationRequests'

// Auth pages
import { Login, Register, ChangePassword } from '../pages/auth'

// Admin pages
import { AdminDashboard } from '../pages/admin/Dashboard'
import { AdminCustomers } from '../pages/admin/Customers'
import { AdminCustomerDetail } from '../pages/admin/CustomerDetail'
import { AdminEmployees } from '../pages/admin/Employees'
import { AdminEmployeeDetail } from '../pages/admin/EmployeeDetail'
import { AdminProducts } from '../pages/admin/Products'
import { AdminInventory } from '../pages/admin/Inventory'
import { AdminQuotations } from '../pages/admin/Quotations'
import { AdminOrders } from '../pages/admin/Orders'
import { AdminPayments } from '../pages/admin/Payments'
import { AdminReturns } from '../pages/admin/Returns'
import { AdminPerformance } from '../pages/admin/Performance'
import { AdminReports } from '../pages/admin/Reports'
import { AdminNotifications } from '../pages/admin/Notifications'

// Manager pages
import { ManagerDashboard } from '../pages/manager/Dashboard'
import { ManagerTeam } from '../pages/manager/Team'
import { ManagerCustomers } from '../pages/manager/Customers'
import { ManagerCustomerDetail } from '../pages/manager/CustomerDetail'
import { ManagerFollowUps } from '../pages/manager/FollowUps'
import { ManagerQuotations } from '../pages/manager/Quotations'
import { ManagerOrders } from '../pages/manager/Orders'
import { ManagerPayments } from '../pages/manager/Payments'
import { ManagerProducts } from '../pages/manager/Products'
import { ManagerProductDetail } from '../pages/manager/Products/ProductDetail'
import { ManagerInventory } from '../pages/manager/Inventory'
import { ManagerPerformance } from '../pages/manager/Performance'
import { ManagerReports } from '../pages/manager/Reports'
import { ManagerNotifications } from '../pages/manager/Notifications'

// Salesperson pages
import { SalespersonDashboard } from '../pages/salesperson/Dashboard'
import { SalespersonCustomers, SalespersonCustomerDetail } from '../pages/salesperson/Customers'
import { SalespersonFollowUps } from '../pages/salesperson/FollowUps'
import { SalespersonQuotations } from '../pages/salesperson/Quotations'
import { SalespersonOrders } from '../pages/salesperson/Orders'
import { SalespersonPayments } from '../pages/salesperson/Payments'
import { SalespersonProducts } from '../pages/salesperson/Products'
import { SalespersonPerformance } from '../pages/salesperson/Performance'
import { SalespersonNotifications } from '../pages/salesperson/Notifications'

// Customer pages
import { CustomerDashboard } from '../pages/customer/Dashboard'
import { CustomerProfile } from '../pages/customer/Profile'
import { CustomerProducts } from '../pages/customer/Products'
import { CustomerQuotations } from '../pages/customer/Quotations'
import { CustomerOrders } from '../pages/customer/Orders'
import { CustomerPayments } from '../pages/customer/Payments'
import { CustomerFollowUps } from '../pages/customer/FollowUps'
import { CustomerNotifications } from '../pages/customer/Notifications'
import { CustomerReturns } from '../pages/customer/Returns'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Register />,
      },
    ],
  },
  {
    path: '/change-password',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <ChangePassword />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RoleIndexRedirect />,
      },
      // Admin routes
      {
        path: 'admin/dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'admin/customers',
        element: <AdminCustomers />,
      },
      {
        path: 'admin/customers/:id',
        element: <AdminCustomerDetail />,
      },
      {
        path: 'admin/employees',
        element: <AdminEmployees />,
      },
      { path: 'admin/employees/:id', element: <AdminEmployeeDetail /> },
      {
        path: 'admin/products',
        element: <AdminProducts />,
      },
      {
        path: 'admin/inventory',
        element: <AdminInventory />,
      },
      {
        path: 'admin/quotations',
        element: <AdminQuotations />,
      },
      {
        path: 'admin/orders',
        element: <AdminOrders />,
      },
      { path: 'admin/orders/:id', element: <OrderDetailPage /> },
      { path: 'admin/products/:id', element: <ProductDetailPage /> },
      { path: 'admin/quotations/:id', element: <QuotationDetailPage /> },
      { path: 'admin/returns/:id', element: <ReturnDetailPage /> },
      { path: 'admin/messages', element: <MessagesPage /> },
      { path: 'admin/quotation-requests', element: <QuotationRequestsPage /> },
      {
        path: 'admin/payments',
        element: <AdminPayments />,
      },
      {
        path: 'admin/returns',
        element: <AdminReturns />,
      },
      {
        path: 'admin/performance',
        element: <AdminPerformance />,
      },
      {
        path: 'admin/reports',
        element: <AdminReports />,
      },
      {
        path: 'admin/notifications',
        element: <AdminNotifications />,
      },

      // Manager routes
      {
        path: 'manager/dashboard',
        element: <ManagerDashboard />,
      },
      {
        path: 'manager/team',
        element: <ManagerTeam />,
      },
      {
        path: 'manager/customers',
        element: <ManagerCustomers />,
      },
      {
        path: 'manager/customers/:id',
        element: <ManagerCustomerDetail />,
      },
      {
        path: 'manager/followups',
        element: <ManagerFollowUps />,
      },
      {
        path: 'manager/quotations',
        element: <ManagerQuotations />,
      },
      {
        path: 'manager/orders',
        element: <ManagerOrders />,
      },
      { path: 'manager/orders/:id', element: <OrderDetailPage /> },
      { path: 'manager/quotations/:id', element: <QuotationDetailPage /> },
      { path: 'manager/quotation-requests', element: <QuotationRequestsPage /> },
      {
        path: 'manager/payments',
        element: <ManagerPayments />,
      },
      {
        path: 'manager/products',
        element: <ManagerProducts />,
      },
      {
        path: 'manager/products/:id',
        element: <ManagerProductDetail />,
      },
      {
        path: 'manager/inventory',
        element: <ManagerInventory />,
      },
      {
        path: 'manager/performance',
        element: <ManagerPerformance />,
      },
      {
        path: 'manager/reports',
        element: <ManagerReports />,
      },
      {
        path: 'manager/notifications',
        element: <ManagerNotifications />,
      },

      // Salesperson routes
      {
        path: 'salesperson/dashboard',
        element: <SalespersonDashboard />,
      },
      {
        path: 'salesperson/customers',
        element: <SalespersonCustomers />,
      },
      {
        path: 'salesperson/customers/:id',
        element: <SalespersonCustomerDetail />,
      },
      {
        path: 'salesperson/followups',
        element: <SalespersonFollowUps />,
      },
      {
        path: 'salesperson/quotations',
        element: <SalespersonQuotations />,
      },
      {
        path: 'salesperson/orders',
        element: <SalespersonOrders />,
      },
      { path: 'salesperson/orders/:id', element: <OrderDetailPage /> },
      { path: 'salesperson/products/:id', element: <ProductDetailPage /> },
      { path: 'salesperson/quotations/:id', element: <QuotationDetailPage /> },
      { path: 'salesperson/messages', element: <MessagesPage /> },
      { path: 'salesperson/quotation-requests', element: <QuotationRequestsPage /> },
      {
        path: 'salesperson/payments',
        element: <SalespersonPayments />,
      },
      {
        path: 'salesperson/products',
        element: <SalespersonProducts />,
      },
      {
        path: 'salesperson/performance',
        element: <SalespersonPerformance />,
      },
      {
        path: 'salesperson/notifications',
        element: <SalespersonNotifications />,
      },

      // Customer routes
      {
        path: 'customer/dashboard',
        element: <CustomerDashboard />,
      },
      {
        path: 'customer/profile',
        element: <CustomerProfile />,
      },
      {
        path: 'customer/products',
        element: <CustomerProducts />,
      },
      {
        path: 'customer/quotations',
        element: <CustomerQuotations />,
      },
      {
        path: 'customer/orders',
        element: <CustomerOrders />,
      },
      { path: 'customer/orders/:id', element: <OrderDetailPage /> },
      { path: 'customer/products/:id', element: <ProductDetailPage /> },
      { path: 'customer/quotations/:id', element: <QuotationDetailPage /> },
      { path: 'customer/messages', element: <MessagesPage /> },
      { path: 'customer/quotation-requests', element: <QuotationRequestsPage /> },
      { path: 'customer/returns/:id', element: <ReturnDetailPage /> },
      {
        path: 'customer/payments',
        element: <CustomerPayments />,
      },
      {
        path: 'customer/followups',
        element: <CustomerFollowUps />,
      },
      {
        path: 'customer/notifications',
        element: <CustomerNotifications />,
      },
      {
        path: 'customer/returns',
        element: <CustomerReturns />,
      },
    ],
  },
])
