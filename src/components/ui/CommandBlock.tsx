import { Check, Copy } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

export interface CommandAnatomyToken {
  token: string
  explanation: string
}

export interface CommandBlockProps {
  command: string
  anatomy?: CommandAnatomyToken[]
  className?: string
}

/**
 * The canonical way to display a Git command (Section 28/29). Always
 * copyable, and can optionally break the command down piece by piece.
 */
export function CommandBlock({ command, anatomy, className }: CommandBlockProps) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-code-bg', className)}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="select-none font-mono text-sm text-foreground-tertiary" aria-hidden="true">
          $
        </span>
        <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm whitespace-pre text-code-text">
          {command}
        </code>
        <button
          type="button"
          onClick={() => copy(command)}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground-tertiary transition-colors duration-150 hover:bg-surface-hover hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      </div>

      {anatomy && anatomy.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-border px-4 py-3">
          {anatomy.map((item) => (
            <div key={item.token} className="contents">
              <dt className="font-mono text-sm font-semibold text-accent">{item.token}</dt>
              <dd className="text-sm text-foreground-secondary">{item.explanation}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
