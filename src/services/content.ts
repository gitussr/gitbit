import { commands } from '@/content/commands'
import { concepts } from '@/content/concepts'
import { ahaCards } from '@/content/aha'
import { quizQuestions } from '@/content/quiz'
import { sosGuides } from '@/content/sos'
import { dailyContent } from '@/content/daily'
import { comparisons } from '@/content/comparisons'
import { learnLevels, type LearnLevel } from '@/content/levels'
import type { Comparison, GitCommand, GitConcept } from '@/content/types'

/** Framework-agnostic lookups over the content model — feature components read through here, not the raw arrays. */

export function getCommandBySlug(slug: string): GitCommand | undefined {
  return commands.find((command) => command.slug === slug)
}

export function getConceptBySlug(slug: string): GitConcept | undefined {
  return concepts.find((concept) => concept.slug === slug)
}

export function getAhaBySlug(slug: string) {
  return ahaCards.find((aha) => aha.slug === slug)
}

export function getDailyBySlug(slug: string) {
  return dailyContent.find((item) => item.slug === slug)
}

export function getQuizBySlug(slug: string) {
  return quizQuestions.find((quiz) => quiz.slug === slug)
}

export function getSosBySlug(slug: string) {
  return sosGuides.find((guide) => guide.slug === slug)
}

export function getComparisonBySlug(slug: string): Comparison | undefined {
  return comparisons.find((comparison) => comparison.slug === slug)
}

/** Commands are referenced by their displayed text ("git reset") in related lists and comparisons, not by slug. */
export function getCommandByName(name: string): GitCommand | undefined {
  return commands.find((command) => command.command === name)
}

/** Every comparison this command is one side of — the "often confused with" rail on a command page (Section 30). */
export function getComparisonsForCommand(command: GitCommand): Comparison[] {
  return comparisons.filter(
    (comparison) => comparison.left.command === command.command || comparison.right.command === command.command,
  )
}

export function getLevelBySlug(slug: string): LearnLevel | undefined {
  return learnLevels.find((level) => level.slug === slug)
}

/** Which learning level a concept belongs to — used to build its canonical /learn URL. */
export function getLevelForConcept(conceptSlug: string): LearnLevel | undefined {
  return learnLevels.find((level) => level.conceptSlugs.includes(conceptSlug))
}

export function getConceptsForLevel(level: LearnLevel): GitConcept[] {
  return level.conceptSlugs.map(getConceptBySlug).filter((c): c is GitConcept => Boolean(c))
}

export function getCommandsForLevel(level: LearnLevel): GitCommand[] {
  return level.commandSlugs.map(getCommandBySlug).filter((c): c is GitCommand => Boolean(c))
}

export function getRelatedCommands(command: GitCommand): GitCommand[] {
  if (!command.relatedCommands) return []
  return command.relatedCommands.map(getCommandByName).filter((c): c is GitCommand => Boolean(c))
}

export function getRelatedConcepts(concept: GitConcept): GitConcept[] {
  if (!concept.relatedConcepts) return []
  return concept.relatedConcepts.map(getConceptBySlug).filter((c): c is GitConcept => Boolean(c))
}

/** Every concept/command a concept links to, resolved for detail-page "related" sections. */
export function getConceptRelatedCommands(concept: GitConcept): GitCommand[] {
  if (!concept.relatedCommands) return []
  return concept.relatedCommands.map(getCommandByName).filter((c): c is GitCommand => Boolean(c))
}

export { commands, concepts, ahaCards, quizQuestions, sosGuides, dailyContent, comparisons, learnLevels }

export type SearchResultType = 'command' | 'concept' | 'aha' | 'sos' | 'comparison'

export interface SearchResult {
  type: SearchResultType
  slug: string
  title: string
  snippet: string
  href: string
}

/** Every query word must appear somewhere in the haystack — order-independent, still dependency-free. */
function matchesQuery(haystack: string, terms: string[]) {
  const lower = haystack.toLowerCase()
  return terms.every((term) => lower.includes(term))
}

/** Simple, dependency-free multi-word search across commands/concepts/Aha/SOS/comparisons (Section 20). */
export function search(query: string): SearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const results: SearchResult[] = []

  for (const command of commands) {
    const haystack = `${command.command} ${command.humanMeaning} ${command.whenToUse} ${command.mentalModel} ${command.whatHappens ?? ''}`
    if (matchesQuery(haystack, terms)) {
      results.push({ type: 'command', slug: command.slug, title: command.command, snippet: command.humanMeaning, href: `/quick/${command.slug}` })
    }
  }

  for (const concept of concepts) {
    const haystack = `${concept.term} ${concept.plainEnglish} ${concept.mentalModel} ${concept.technicalExplanation}`
    if (matchesQuery(haystack, terms)) {
      const level = getLevelForConcept(concept.slug)
      results.push({
        type: 'concept',
        slug: concept.slug,
        title: concept.term,
        snippet: concept.plainEnglish,
        href: level ? `/learn/${level.slug}/${concept.slug}` : '/learn',
      })
    }
  }

  for (const aha of ahaCards) {
    if (matchesQuery(`${aha.statement} ${aha.explanation}`, terms)) {
      results.push({ type: 'aha', slug: aha.slug, title: aha.statement, snippet: aha.explanation, href: `/aha/${aha.slug}` })
    }
  }

  for (const guide of sosGuides) {
    if (matchesQuery(`${guide.situation} ${guide.reassurance}`, terms)) {
      results.push({ type: 'sos', slug: guide.slug, title: guide.situation, snippet: guide.reassurance, href: `/sos/${guide.slug}` })
    }
  }

  for (const comparison of comparisons) {
    const haystack = `${comparison.title} ${comparison.left.plainEnglish} ${comparison.right.plainEnglish} ${comparison.explanation}`
    if (matchesQuery(haystack, terms)) {
      results.push({
        type: 'comparison',
        slug: comparison.slug,
        title: comparison.title,
        snippet: comparison.explanation,
        href: `/compare/${comparison.slug}`,
      })
    }
  }

  return results
}
