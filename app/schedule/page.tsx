'use client'

import Schedule from '@/components/Schedule'
import Layout from '@/components/Layout'

export default function SchedulePage() {
  return (
    <Layout currentView="schedule">
      <Schedule />
    </Layout>
  )
}