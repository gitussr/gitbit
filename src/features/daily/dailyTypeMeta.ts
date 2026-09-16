import { Lightbulb, BookOpen, Terminal, GitCompare, AlertTriangle, MapPin, Sparkles, Brain, Trophy } from 'lucide-react'
import type { DailyContentType } from '@/content/types'

/** Label and icon for each GitBit Daily type, shared by the feed and the single-bit page. */
export const dailyTypeMeta: Record<DailyContentType, { label: string; icon: typeof Lightbulb }> = {
  aha: { label: 'Aha', icon: Lightbulb },
  vocabulary: { label: 'Vocabulary', icon: BookOpen },
  command: { label: 'Command', icon: Terminal },
  comparison: { label: 'Compare', icon: GitCompare },
  'common-mistake': { label: 'Common mistake', icon: AlertTriangle },
  scenario: { label: 'Real-world scenario', icon: MapPin },
  'did-you-know': { label: 'Did you know', icon: Sparkles },
  recall: { label: 'Recall', icon: Brain },
  'mini-challenge': { label: 'Mini challenge', icon: Trophy },
}
