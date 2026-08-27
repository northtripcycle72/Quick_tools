import type { Metadata } from 'next'
import AdminDashboardClient from './AdminDashboardClient'

export const metadata: Metadata = {
  title: 'Admin Control Center — QuickTools',
  description: 'Manage users, control tool active status, and monitor system performance.',
}

export default function AdminPage() {
  return <AdminDashboardClient />
}
