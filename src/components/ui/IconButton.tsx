import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { ButtonVariant, ButtonSize } from './Button'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: Extract<ButtonVariant, 'secondary' | 'ghost'>
  size?: ButtonSize
}

const variantStyles = {
  secondary: 'bg-surface text-foreground border border-border hover:bg-surface-hover',
  ghost: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'size-8 rounded-md [&_svg]:size-4',
  md: 'size-10 rounded-md [&_svg]:size-4.5',
  lg: 'size-12 rounded-lg [&_svg]:size-5',
}

/** A square, icon-only button. Always requires an accessible `label`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, icon, label, variant = 'ghost', size = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center transition-colors duration-200 ease-standard',
        'disabled:pointer-events-none disabled:opacity-45',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
})
