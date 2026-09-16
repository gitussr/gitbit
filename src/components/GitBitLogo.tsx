import { cn } from '@/utils/cn'
import logoUrl from '@/assets/gitbit-logo.png'

/**
 * Wordmark + mark (Section 22). The mark is `src/assets/gitbit-logo.png` —
 * the same file every favicon and installed-app icon is generated from
 * (`npm run icons`), so the header and the home-screen icon can't drift
 * apart. Replace that one file to change the logo everywhere.
 */
export function GitBitLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-base font-bold tracking-tight text-foreground', className)}>
      <img src={logoUrl} alt="" width={28} height={28} className="size-7 border-2 border-accent" />
      GitBit
    </span>
  )
}
