import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * `highlight` is the lime call-to-action — at most one per view, for the
 * single most important action (e.g. the home hero). `inverse` is the
 * secondary action on the always-dark `feature` ground, where `secondary`
 * would read as a light slab.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'highlight' | 'inverse'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-foreground-inverse shadow-xs hover:bg-accent-strong',
  secondary: 'border border-border bg-surface text-foreground shadow-xs hover:border-border-strong hover:bg-surface-hover',
  ghost: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
  danger: 'bg-danger text-foreground-inverse shadow-xs hover:brightness-95',
  highlight: 'bg-highlight text-highlight-ink shadow-xs hover:bg-highlight-hover',
  inverse: 'border border-feature-border text-feature-text hover:bg-feature-hover',
}

/** One radius and one weight at every size, so buttons read as one family wherever they appear. */
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
    'inline-flex shrink-0 items-center justify-center rounded-md font-semibold whitespace-nowrap',
    'transition-[background-color,border-color,color,transform] duration-200 ease-standard active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-45',
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
