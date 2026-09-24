import { visualizerMoments, type VisualizerMoment } from '@/content/visualizer/moments'
import { meets, type Transition } from '@/services/git-sim'

/** What one change earned: an Aha card, a Recall question, or both — by slug. */
export interface MomentPick {
  aha?: string
  recall?: string
}

/**
 * Which change surfaced which Aha and Recall, one slot per transition.
 *
 * Read off the whole history rather than kept as state, the way scenario
 * progress is: undo a step and its moment goes with it, redo and it comes
 * back, and nothing can drift out of step with what actually happened.
 *
 * Selective, as Section 26 asks. An Aha card appears the first time its
 * moment happens and never again — the tenth `git add` doesn't need the
 * speech the first one got. A Recall question is never offered twice in a
 * row, and one skipped for that reason stays available for next time.
 */
export function momentsFor(history: Transition[], rules: VisualizerMoment[] = visualizerMoments): (MomentPick | null)[] {
  const shownAha = new Set<string>()
  const askedRecall = new Set<string>()
  let askedLast = false

  return history.map((transition) => {
    let pick: MomentPick | null = null
    for (const rule of rules) {
      if (!meets(transition, rule.when)) continue
      const aha = rule.aha && !shownAha.has(rule.aha) ? rule.aha : undefined
      const recall = rule.recall && !askedRecall.has(rule.recall) && !askedLast ? rule.recall : undefined
      if (aha || recall) {
        pick = { aha, recall }
        break
      }
    }

    if (pick?.aha) shownAha.add(pick.aha)
    if (pick?.recall) askedRecall.add(pick.recall)
    askedLast = Boolean(pick?.recall)
    return pick
  })
}

/** The moment the latest change earned, if any. */
export function latestMoment(history: Transition[]): MomentPick | null {
  return momentsFor(history).at(-1) ?? null
}
