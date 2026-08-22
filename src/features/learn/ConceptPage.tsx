import { useParams } from 'react-router-dom'
import { PageStub } from '@/app/PageStub'

export default function ConceptPage() {
  const { conceptSlug } = useParams()
  return <PageStub title={conceptSlug ?? 'Concept'} description="Concept lesson." />
}
