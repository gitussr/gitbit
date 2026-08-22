import { useParams } from 'react-router-dom'
import { PageStub } from '@/app/PageStub'

export default function QuizQuestionPage() {
  const { slug } = useParams()
  return <PageStub title={slug ?? 'Question'} description="Quiz question." />
}
