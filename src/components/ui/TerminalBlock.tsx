import { cn } from '@/utils/cn'

export interface TerminalBlockProps {
  command: string
  gitSays?: string
  humanTranslation?: string
  className?: string
}

/**
 * GitBit Terminal's core unit (Section 4): a simulated command, Git's
 * literal output, and a plain-English translation. Always dark —
 * terminal chrome stays consistent regardless of the app theme.
 */
export function TerminalBlock({ command, gitSays, humanTranslation, className }: TerminalBlockProps) {
  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-white/10 bg-terminal-bg shadow-md', className)}
      role="group"
      aria-label="Simulated terminal"
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-4 p-4 font-mono text-sm">
        <p className="text-terminal-text">
          <span className="text-terminal-prompt">$</span> {command}
        </p>

        {gitSays && (
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-wide text-white/55 uppercase">Git says</p>
            <p className="text-terminal-text/90 whitespace-pre-line">{gitSays}</p>
          </div>
        )}

        {humanTranslation && (
          <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
            <p className="text-xs tracking-wide text-white/55 uppercase">Human translation</p>
            <p className="text-terminal-prompt italic">{humanTranslation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
