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
    <div className={cn('overflow-hidden border-2 border-accent bg-code-bg', className)}>
      <div className="flex items-center gap-2.5 px-3 py-2">
        <span className="select-none font-mono text-sm text-highlight" aria-hidden="true">
          $
        </span>
        <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm whitespace-pre text-code-text">
          {command}
        </code>
        <button
          type="button"
          onClick={() => copy(command)}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className="inline-flex size-7 shrink-0 items-center justify-center text-code-muted transition-colors duration-150 hover:bg-feature-hover hover:text-code-text"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      </div>

      {anatomy && anatomy.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t-2 border-feature-hover px-3 py-2.5">
          {anatomy.map((item) => (
            <div key={item.token} className="contents">
              <dt className="font-mono text-sm font-bold text-highlight">{item.token}</dt>
              <dd className="text-body-sm text-code-muted">{item.explanation}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
