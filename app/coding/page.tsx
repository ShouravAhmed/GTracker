import type { Metadata } from 'next'
import GamamCategory from '@/components/GamamCategory'

export const metadata: Metadata = {
  title: 'Coding',
  description: 'Track and practice GAMAM coding interview problems. Log solve times and focus sessions.',
}

export default function CodingPage() {
  return <GamamCategory categoryName="Coding" />
}

