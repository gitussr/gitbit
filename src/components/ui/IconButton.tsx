import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { ButtonSize } from './Button'

export type IconButtonVariant = 'secondary' | 'ghost'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: IconButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<IconButtonVariant, string> = {
  secondary: 'border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-hover',
  ghost: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
}

/** Same heights and radius as `Button`, so an icon button sits flush beside a text one. */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-9 [&_svg]:size-4',
  lg: 'size-10 [&_svg]:size-4.5',
}

/** Also used by icon-only links (e.g. the header's search link) so they match the buttons beside them. */
export function iconButtonClassName(variant: IconButtonVariant = 'ghost', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-200 ease-standard',
    'disabled:pointer-events-none disabled:opacity-45',
    variantStyles[variant],
    sizeStyles[size],
    className,
  )
}

/** A square, icon-only button. Always requires an accessible `label`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, icon, label, variant, size, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={iconButtonClassName(variant, size, className)}
      {...props}
    >
      {icon}
    </button>
  )
})
