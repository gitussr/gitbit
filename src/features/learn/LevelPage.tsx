import { useParams } from 'react-router-dom'
import { PageStub } from '@/app/PageStub'

export default function LevelPage() {
  const { levelSlug } = useParams()
  return <PageStub title={levelSlug ?? 'Level'} description="Learning level." />
}
