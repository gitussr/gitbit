import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-foreground-inverse shadow-sm hover:bg-accent-strong active:scale-[0.98]',
  secondary:
    'bg-surface text-foreground border border-border hover:bg-surface-hover hover:border-border-strong active:scale-[0.98]',
  ghost: 'text-foreground hover:bg-surface-hover active:scale-[0.98]',
  danger: 'bg-danger text-foreground-inverse shadow-sm hover:brightness-95 active:scale-[0.98]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md [&_svg]:size-4',
  md: 'h-10 px-4 text-sm gap-2 rounded-md [&_svg]:size-4',
  lg: 'h-12 px-5 text-base gap-2 rounded-lg [&_svg]:size-5',
}

/** Primary interactive control. Never style buttons ad hoc — extend variants here instead. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', leadingIcon, trailingIcon, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap transition-[background-color,border-color,transform] duration-200 ease-standard',
        'disabled:pointer-events-none disabled:opacity-45',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})
