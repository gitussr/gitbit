import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's built-in font sizes. Without this, it
 * reads a custom size token like `text-body-sm` as a text *colour*, and drops
 * it the moment a real colour (`text-foreground-secondary`) follows — so the
 * text silently falls back to 16px. Every `--text-*` token in tokens.css
 * must be listed here.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['body-sm', 'body-lg'],
    },
  },
})

/** Merge Tailwind class lists, resolving conflicting utilities predictably. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
