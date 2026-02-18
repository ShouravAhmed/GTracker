import type { Metadata } from 'next'
import GamamCategory from '@/components/GamamCategory'

export const metadata: Metadata = {
  title: 'Schema Design',
  description: 'Practice GAMAM schema and database design interview problems.',
}

export default function SchemaDesignPage() {
  return <GamamCategory categoryName="SchemaDesign" />
}

