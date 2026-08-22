import { useParams } from 'react-router-dom'
import { PageStub } from '@/app/PageStub'

export default function CommandDetailPage() {
  const { commandSlug } = useParams()
  return <PageStub title={commandSlug ?? 'Command'} description="Command detail." />
}
