import type { Metadata } from 'next'
import Gamam150 from '@/components/Gamam150'

export const metadata: Metadata = {
  title: 'GAMAM 150',
  description: 'GAMAM 150 problem list. Track progress, focus time, and solve times for the full list.',
}

export default function Gamam150Page() {
  return <Gamam150 />
}

