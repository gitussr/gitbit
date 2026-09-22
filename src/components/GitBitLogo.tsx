import { cn } from '@/utils/cn'
import logoUrl from '@/assets/gitbit-logo-84.png'

/**
 * Wordmark + mark (Section 22). Everything still comes from the one source,
 * `src/assets/gitbit-logo.png` — `npm run icons` generates every favicon and
 * installed-app icon from it, and the 84px file used here, so the header and
 * the home-screen icon can't drift apart. Replace that one file and re-run
 * the script to change the logo everywhere.
 *
 * 84px rather than the 512px source: this renders at 28 CSS px, and shipping
 * the full-size art cost 24 KB on the critical path to draw a small square.
 */
export function GitBitLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-base font-bold tracking-tight text-foreground', className)}>
      <img src={logoUrl} alt="" width={28} height={28} className="size-7 border-2 border-accent" />
      GitBit
    </span>
  )
}
