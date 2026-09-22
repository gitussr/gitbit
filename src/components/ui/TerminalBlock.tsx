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
      className={cn('overflow-hidden border-2 border-accent bg-terminal-bg shadow-brutal', className)}
      role="group"
      aria-label="Simulated terminal"
    >
      {/* Quoted macOS window controls: red/amber/green reads as "terminal" at a
          glance in a way three grey dots don't. Decorative — they do nothing. */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5" aria-hidden="true">
        <span className="size-3 rounded-full bg-terminal-close" />
        <span className="size-3 rounded-full bg-terminal-minimize" />
        <span className="size-3 rounded-full bg-terminal-zoom" />
      </div>

      <div className="flex flex-col gap-3 p-3.5 font-mono text-sm">
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
            <p className="text-terminal-accent italic">{humanTranslation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
