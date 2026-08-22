import type { RouteObject } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import {
  HomePage,
  QuickPage,
  CommandDetailPage,
  LearnPage,
  LevelPage,
  ConceptPage,
  AhaPage,
  AhaDetailPage,
  QuizPage,
  QuizQuestionPage,
  SosPage,
  SosDetailPage,
  TerminalPage,
  DailyPage,
  SearchPage,
  DesignSystemPage,
  NotFoundPage,
} from '@/app/lazyPages'

/**
 * GitBit route table (information architecture, Section 4).
 *
 * Each product module is a feature boundary under `src/features/*`
 * and owns its own routes, reading content from `src/content/*`.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      // GitBit Quick — searchable command cheat sheet
      { path: 'quick', element: <QuickPage /> },
      { path: 'quick/:commandSlug', element: <CommandDetailPage /> },

      // GitBit Learn — structured learning path (Levels 0-6)
      { path: 'learn', element: <LearnPage /> },
      { path: 'learn/:levelSlug', element: <LevelPage /> },
      { path: 'learn/:levelSlug/:conceptSlug', element: <ConceptPage /> },

      // GitBit Aha — short conceptual explanations
      { path: 'aha', element: <AhaPage /> },
      { path: 'aha/:slug', element: <AhaDetailPage /> },

      // GitBit Quiz — knowledge checks
      { path: 'quiz', element: <QuizPage /> },
      { path: 'quiz/:slug', element: <QuizQuestionPage /> },

      // GitBit SOS — recovery guides
      { path: 'sos', element: <SosPage /> },
      { path: 'sos/:slug', element: <SosDetailPage /> },

      // GitBit Terminal — terminal-inspired educational interface
      { path: 'terminal', element: <TerminalPage /> },

      // GitBit Daily — micro-learning
      { path: 'daily', element: <DailyPage /> },

      // Cross-cutting search
      { path: 'search', element: <SearchPage /> },

      // Internal Design System showcase (Phase 3)
      { path: 'design-system', element: <DesignSystemPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
