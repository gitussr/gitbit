import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { panelClassName } from './StatePanel'
import { Text } from './Typography'

export interface LegendItem {
  /** The mark itself, drawn by the primitive that draws it for real. Decorative. */
  swatch: ReactNode
  label: string
  meaning: string
}

export interface LegendSection {
  title: string
  items: LegendItem[]
}

export interface LegendProps {
  sections: LegendSection[]
  summary?: string
  className?: string
}

/**
 * A compact key to a diagram (Visualizer Section 31) — closed until asked
 * for, so it stays out of the way of the thing it explains.
 *
 * A native `<details>`: keyboard, screen readers and find-in-page all work
 * without help. Each section is a description list, so a screen reader
 * hears each label paired with its meaning; the swatches are decorative,
 * because the words already say everything they show.
 */
export function Legend({ sections, summary = 'What the shapes mean', className }: LegendProps) {
  return (
    <details className={cn('group text-body-sm', className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
        {summary}
      </summary>

      <div className={panelClassName(false, 'mt-2 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4')}>
        {sections.map((section) => (
          <section key={section.title} className="flex min-w-0 flex-col gap-2">
            <Text as="h2" variant="caption" tone="secondary" className="font-bold uppercase">
              {section.title}
            </Text>
            <dl className="flex flex-col gap-2">
              {section.items.map((item) => (
                // dt and dd directly inside the group's div, as a <dl> requires;
                // the meaning is indented to sit under the label, past the swatch.
                <div key={item.label} className="flex flex-col">
                  <dt className="flex items-center gap-2.5 font-semibold">
                    <span className="flex min-h-6 w-24 shrink-0 items-center">{item.swatch}</span>
                    {item.label}
                  </dt>
                  <dd className="pl-[6.625rem] text-foreground-secondary">{item.meaning}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </details>
  )
}
