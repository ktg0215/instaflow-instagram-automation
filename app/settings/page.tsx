'use client'

import Settings from '@/components/Settings'
import Layout from '@/components/Layout'

export default function SettingsPage() {
  return (
    <Layout currentView="settings">
      <Settings />
    </Layout>
  )
}