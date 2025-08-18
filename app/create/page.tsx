'use client'

import CreatePost from '@/components/CreatePost'
import Layout from '@/components/Layout'

export default function CreatePage() {
  return (
    <Layout currentView="create">
      <CreatePost />
    </Layout>
  )
}