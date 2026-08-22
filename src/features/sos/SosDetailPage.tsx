import { useParams } from 'react-router-dom'
import { PageStub } from '@/app/PageStub'

export default function SosDetailPage() {
  const { slug } = useParams()
  return <PageStub title={slug ?? 'SOS'} description="Recovery guide." />
}
