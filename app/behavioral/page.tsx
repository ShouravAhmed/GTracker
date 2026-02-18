import type { Metadata } from 'next'
import GamamCategory from '@/components/GamamCategory'

export const metadata: Metadata = {
  title: 'Behavioral',
  description: 'Practice GAMAM behavioral interview questions and track your prep.',
}

export default function BehavioralPage() {
  return <GamamCategory categoryName="Behavioral" />
}

