'use client'

import Dashboard from '@/components/Dashboard'
import Layout from '@/components/Layout'

export default function DashboardPage() {
  return (
    <Layout currentView="dashboard">
      <Dashboard />
    </Layout>
  )
}