import { RefreshCw } from 'lucide-react'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

/** Calm error messaging (Section 32) — never blames the user. */
export function ErrorState({
  title = 'Something didn’t load',
  description = 'That’s on us, not you. Give it another try.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-12 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-foreground-tertiary">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" leadingIcon={<RefreshCw aria-hidden="true" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
