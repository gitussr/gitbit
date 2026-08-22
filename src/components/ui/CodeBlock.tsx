import { Check, Copy } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

export interface CodeBlockProps {
  code: string
  label?: string
  className?: string
}

/** Generic code display for non-command snippets (config, output, file contents). */
export function CodeBlock({ code, label, className }: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-code-bg', className)}>
      {label && (
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <span className="text-xs font-medium text-foreground-tertiary">{label}</span>
        </div>
      )}
      <div className="group relative">
        <pre className="overflow-x-auto p-4 font-mono text-sm text-code-text">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={() => copy(code)}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className={cn(
            'absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md',
            'border border-border bg-surface text-foreground-tertiary opacity-0 transition-opacity duration-150',
            'hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100',
          )}
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
