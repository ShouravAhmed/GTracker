import type { Metadata } from 'next'
import GamamCategory from '@/components/GamamCategory'

export const metadata: Metadata = {
  title: 'System Design',
  description: 'Practice GAMAM system design interview problems. Track progress and notes.',
}

export default function SystemDesignPage() {
  return <GamamCategory categoryName="SystemDesign" />
}

