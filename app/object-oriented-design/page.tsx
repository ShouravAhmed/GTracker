import type { Metadata } from 'next'
import GamamCategory from '@/components/GamamCategory'

export const metadata: Metadata = {
  title: 'Object-Oriented Design',
  description: 'Practice GAMAM object-oriented design (OOD) interview problems.',
}

export default function ObjectOrientedDesignPage() {
  return <GamamCategory categoryName="ObjectOrientedDesign" />
}

