import { useMemo } from 'react'
import { AhaMoment } from '@/components/cards/AhaMoment'
import { RecallCard } from '@/components/cards/RecallCard'
import { getAhaBySlug, getQuizBySlug } from '@/services/content'
import type { Transition } from '@/services/git-sim'
import { latestMoment } from './moments'

export interface LearningMomentProps {
  /** Everything that has happened, oldest first. Only the last change can earn a moment. */
  history: Transition[]
}

/**
 * The `(aha) → (recall)` end of the interaction loop (docs/VISUALIZER.md).
 *
 * Its own chunk: the Aha and Quiz banks it reads come with it, and the
 * stage works before they arrive. What to show is decided in `moments.ts`,
 * from content rules; the words are the Aha and Quiz modules' own.
 */
export default function LearningMoment({ history }: LearningMomentProps) {
  const moment = useMemo(() => latestMoment(history), [history])
  const aha = moment?.aha ? getAhaBySlug(moment.aha) : undefined
  const quiz = moment?.recall ? getQuizBySlug(moment.recall) : undefined
  if (!aha && !quiz) return null

  return (
    <div className="flex flex-col gap-4">
      {aha && <AhaMoment aha={aha} />}
      {/* Keyed by the change that asked it, so the next question starts unanswered. */}
      {quiz && <RecallCard key={history.length} quiz={quiz} />}
    </div>
  )
}
