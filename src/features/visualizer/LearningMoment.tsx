import { useMemo } from 'react'
import { AhaMoment } from '@/components/cards/AhaMoment'
import { RecallCard } from '@/components/cards/RecallCard'
import { InlineCode, Text } from '@/components/ui/Typography'
import { getAhaBySlug, getQuizBySlug } from '@/services/content'
import type { Transition } from '@/services/git-sim'
import { latestMoment } from './moments'

export interface LearningMomentProps {
  /** Everything that has happened, oldest first. The newest moment in it is shown until another replaces it. */
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
  const aha = moment?.pick.aha ? getAhaBySlug(moment.pick.aha) : undefined
  const quiz = moment?.pick.recall ? getQuizBySlug(moment.pick.recall) : undefined
  if (!moment || (!aha && !quiz)) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Always there, so it never appears above the card and pushes it down —
          and an older card is never mistaken for news about the last command. */}
      <Text variant="caption" tone="secondary" className="-mb-2">
        From <InlineCode>{history[moment.index].input}</InlineCode>
      </Text>
      {aha && <AhaMoment aha={aha} />}
      {/* Keyed by the change that asked it, so a new question starts unanswered and an old one stays answered. */}
      {quiz && <RecallCard key={moment.index} quiz={quiz} />}
    </div>
  )
}
