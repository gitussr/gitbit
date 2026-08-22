import { useParams } from 'react-router-dom'
import { PageStub } from '@/app/PageStub'

export default function AhaDetailPage() {
  const { slug } = useParams()
  return <PageStub title={slug ?? 'Aha'} description="Aha detail." />
}
