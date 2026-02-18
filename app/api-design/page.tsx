import type { Metadata } from 'next'
import GamamCategory from '@/components/GamamCategory'

export const metadata: Metadata = {
  title: 'API Design',
  description: 'Practice GAMAM API design interview problems.',
}

export default function ApiDesignPage() {
  return <GamamCategory categoryName="APIDesign" />
}

