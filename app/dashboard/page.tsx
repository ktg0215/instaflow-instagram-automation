'use client'

import EnhancedDashboard from '@/components/EnhancedDashboard'
import Layout from '@/components/Layout'

export default function DashboardPage() {
  return (
    <Layout currentView="dashboard">
      <EnhancedDashboard />
    </Layout>
  )
}