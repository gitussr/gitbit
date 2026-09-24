import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ChoiceListProps {
  choices: string[]
  correctIndex: number
  /** The choice picked, or null while unanswered. */
  selected: number | null
  onSelect: (index: number) => void
  label?: string
  /** `sm` for a question sitting in a side panel rather than filling a page. */
  size?: 'md' | 'sm'
  className?: string
}

/**
 * One question's answer buttons — shared by GitBit Quiz and the
 * Visualizer's Quick Recall, so a question looks and behaves the same
 * wherever it is asked.
 *
 * One try: once answered, every choice locks, the right one turns safe and
 * a wrong pick turns danger, each with an icon as well as a colour. The
 * explanation is the caller's to show.
 */
export function ChoiceList({ choices, correctIndex, selected, onSelect, label = 'Answer choices', size = 'md', className }: ChoiceListProps) {
  const answered = selected !== null

  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-2', className)}>
      {choices.map((choice, index) => {
        const isSelected = selected === index
        const isRightAnswer = index === correctIndex
        const showState = answered && (isSelected || isRightAnswer)

        return (
          <button
            key={choice}
            type="button"
            aria-pressed={isSelected}
            disabled={answered}
            onClick={() => onSelect(index)}
            className={cn(
              'flex items-center justify-between gap-3 border-2 text-left font-bold transition-colors duration-150 ease-standard',
              'disabled:cursor-default',
              size === 'md' ? 'px-3.5 py-2.5 text-sm' : 'min-h-9 px-3 py-1.5 text-body-sm',
              !answered && 'border-accent bg-surface shadow-brutal-sm hover:bg-accent-subtle',
              showState && isRightAnswer && 'border-safe-border bg-safe-subtle text-foreground',
              showState && isSelected && !isRightAnswer && 'border-danger-border bg-danger-subtle text-foreground',
              answered && !isSelected && !isRightAnswer && 'border-accent bg-surface text-foreground-tertiary',
            )}
          >
            {choice}
            {showState && isRightAnswer && <Check className="size-4 shrink-0" aria-label="correct answer" />}
            {showState && isSelected && !isRightAnswer && <X className="size-4 shrink-0" aria-label="your answer" />}
          </button>
        )
      })}
    </div>
  )
}
