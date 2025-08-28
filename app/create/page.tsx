'use client'

import PostCreationWizard from '@/components/PostCreationWizard'
import Layout from '@/components/Layout'

export default function CreatePage() {
  return (
    <Layout currentView="create">
      <PostCreationWizard />
    </Layout>
  )
}