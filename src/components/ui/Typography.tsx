import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type HeadingLevel = 1 | 2 | 3 | 4

const headingStyles: Record<HeadingLevel, string> = {
  1: 'text-2xl md:text-3xl font-bold tracking-tight',
  2: 'text-xl md:text-2xl font-bold tracking-tight',
  3: 'text-lg font-semibold tracking-tight',
  4: 'text-base font-semibold',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level — picks the rendered tag (h1-h4) and must stay sequential in a page's reading order (Section 24). */
  level: HeadingLevel
  /** Visual size, when it needs to differ from the semantic level (e.g. an h2 that should look smaller). Defaults to `level`. */
  size?: HeadingLevel
  /** Render a different tag than `level` implies, while keeping the same visual size. */
  as?: ElementType
}

/** The only place heading sizes are defined — never hard-code a font size for a title. */
export function Heading({ level, size, as, className, ...props }: HeadingProps) {
  const Tag = as ?? (`h${level}` as ElementType)
  return <Tag className={cn('text-foreground', headingStyles[size ?? level], className)} {...props} />
}

type TextVariant = 'body-lg' | 'body' | 'body-sm' | 'caption'
type TextTone = 'primary' | 'secondary' | 'tertiary'

const textStyles: Record<TextVariant, string> = {
  'body-lg': 'text-body-lg',
  body: 'text-sm leading-6',
  'body-sm': 'text-body-sm',
  caption: 'text-xs',
}

const toneStyles: Record<TextTone, string> = {
  primary: 'text-foreground',
  secondary: 'text-foreground-secondary',
  tertiary: 'text-foreground-tertiary',
}

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant
  tone?: TextTone
  as?: ElementType
}

export function Text({ variant = 'body', tone = 'primary', as: Tag = 'p', className, ...props }: TextProps) {
  return <Tag className={cn(textStyles[variant], toneStyles[tone], className)} {...props} />
}

/**
 * A command or path inside a sentence — the ink chip the reference card
 * uses for `git init`. Monospace matters beyond looks: in Manrope, `--abort`
 * renders with a dash ligature and stops being something you can type.
 */
export function InlineCode({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn('bg-code-bg px-1.5 py-0.5 font-mono text-[0.85em] whitespace-nowrap text-code-text', className)}
      {...props}
    />
  )
}
