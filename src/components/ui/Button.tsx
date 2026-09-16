import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * `primary` is ink with lime text, the default action. `highlight` is lime
 * with ink text — at most one per view, for the single most important
 * action. `inverse` is the secondary action on the ink `feature` ground.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'highlight' | 'inverse'
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Raised variants carry the hard ink shadow and "press in" toward it on
 * hover and click — the element moves by exactly the shadow it loses, so
 * its shadow corner stays put.
 */
const raised =
  'border-accent shadow-brutal-sm hover:-translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm-pressed active:-translate-x-[3px] active:translate-y-[3px] active:shadow-none'

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(raised, 'bg-accent text-highlight'),
  secondary: cn(raised, 'bg-surface text-foreground'),
  danger: cn(raised, 'bg-danger-subtle text-foreground'),
  highlight: cn(raised, 'bg-highlight text-highlight-ink'),
  ghost: 'border-transparent text-foreground hover:border-accent hover:bg-accent-subtle',
  inverse: 'border-feature-text-secondary text-feature-text hover:bg-feature-hover',
}

/** One shape and one weight at every size, so buttons read as one family wherever they appear. */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-body-sm [&_svg]:size-3.5',
  md: 'h-9 gap-2 px-3.5 text-sm [&_svg]:size-4',
  lg: 'h-10 gap-2 px-4 text-sm [&_svg]:size-4',
}

interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

/** Shared by `Button` and `ButtonLink` only — extend the variants here rather than styling a button ad hoc. */
export function buttonClassName(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center border-2 font-bold whitespace-nowrap',
    'transition-[background-color,box-shadow,transform] duration-150 ease-standard',
    'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
    variantStyles[variant],
    sizeStyles[size],
    className,
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {}

/** An action. For navigation use `ButtonLink` — never wrap a Button in a Link (nested interactive elements). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, leadingIcon, trailingIcon, children, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClassName(variant, size, className)} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})

export interface ButtonLinkProps extends Omit<LinkProps, 'className'>, ButtonStyleProps {
  className?: string
}

/** Navigation styled as a button: a real `<a>`, so it can open in a new tab and is announced as a link. */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, variant, size, leadingIcon, trailingIcon, children, ...props },
  ref,
) {
  return (
    <Link ref={ref} className={buttonClassName(variant, size, className)} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  )
})
