import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type HeadingLevel = 1 | 2 | 3 | 4

const headingStyles: Record<HeadingLevel, string> = {
  1: 'text-3xl md:text-4xl font-semibold tracking-tight',
  2: 'text-2xl md:text-3xl font-semibold tracking-tight',
  3: 'text-xl md:text-2xl font-semibold',
  4: 'text-lg font-semibold',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel
  /** Render a different tag than the visual level implies (keep heading order correct — Section 24). */
  as?: ElementType
}

/** The only place heading sizes are defined — never hard-code a font size for a title. */
export function Heading({ level, as, className, ...props }: HeadingProps) {
  const Tag = as ?? (`h${level}` as ElementType)
  return <Tag className={cn('text-foreground', headingStyles[level], className)} {...props} />
}

type TextVariant = 'body-lg' | 'body' | 'body-sm' | 'caption'
type TextTone = 'primary' | 'secondary' | 'tertiary'

const textStyles: Record<TextVariant, string> = {
  'body-lg': 'text-base md:text-lg',
  body: 'text-sm md:text-base',
  'body-sm': 'text-sm',
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
