/**
 * GitBit knowledge base — shared content types.
 *
 * All Git knowledge lives as structured, typed data under `src/content/**`.
 * UI components read this data; they never hard-code explanations.
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type DangerLevel = 'safe' | 'caution' | 'high-caution'

export type ContentCategory =
  | 'core-concept'
  | 'command'
  | 'workflow'
  | 'collaboration'
  | 'undo-recovery'
  | 'advanced'

/** A single Git term/concept in the GitBit vocabulary system (Section 5). */
export interface GitConcept {
  slug: string
  term: string
  category: ContentCategory
  plainEnglish: string
  mentalModel: string
  technicalExplanation: string
  example?: string
  whenToUse?: string
  whatHappens?: string
  commonMistake?: string
  relatedCommands?: string[]
  relatedConcepts?: string[]
  difficulty: Difficulty
  dangerLevel?: DangerLevel
  ahaPotential?: boolean
  notificationEligible?: boolean
}

/** A command entry for GitBit Quick, following the Command Information Model (Section 28). */
export interface GitCommand {
  slug: string
  command: string
  humanMeaning: string
  technicalMeaning: string
  whenToUse: string
  syntax: string
  example: string
  whatHappens: string
  mentalModel: string
  commonMistake?: string
  relatedCommands?: string[]
  dangerLevel: DangerLevel
  anatomy?: { token: string; explanation: string }[]
}

/** GitBit Aha — short, highly visual conceptual explanations (Section 4). */
export interface AhaCard {
  slug: string
  statement: string
  explanation: string
  relatedConcepts?: string[]
}

/** GitBit Quiz — a single knowledge-check question. */
export interface QuizQuestion {
  slug: string
  prompt: string
  scenario?: string
  choices: string[]
  correctIndex: number
  explanation: string
  relatedConcepts?: string[]
  difficulty: Difficulty
}

/** GitBit SOS — calm, step-by-step recovery guides (Section 32). */
export interface SosGuide {
  slug: string
  situation: string
  reassurance: string
  steps: { instruction: string; command?: string; explanation?: string }[]
  dangerLevel: DangerLevel
  relatedConcepts?: string[]
}

/** GitBit Daily — a single micro-learning notification/card (Sections 6-8). */
export type DailyContentType =
  | 'aha'
  | 'vocabulary'
  | 'command'
  | 'comparison'
  | 'common-mistake'
  | 'scenario'
  | 'did-you-know'
  | 'recall'
  | 'mini-challenge'

export interface DailyContentItem {
  slug: string
  type: DailyContentType
  title: string
  body: string
  relatedConcepts?: string[]
  relatedCommands?: string[]
  notificationEligible: boolean
}

/** GitBit comparisons — commonly confused command pairs (Section 30). */
export interface Comparison {
  slug: string
  title: string
  left: { command: string; plainEnglish: string }
  right: { command: string; plainEnglish: string }
  explanation: string
}
