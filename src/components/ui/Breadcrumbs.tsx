import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      {/* One line: parent crumbs keep their width and the current page (which repeats the h1 below) truncates. */}
      <ol className="flex min-w-0 items-center gap-1.5 text-body-sm text-foreground-tertiary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className={isLast ? 'flex min-w-0 items-center' : 'flex shrink-0 items-center gap-1.5'}>
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  /* min-h-6: the text is 20px tall, under the 24px minimum target size, and
                     a breadcrumb is a nav control rather than a link inside a sentence. */
                  className="inline-flex min-h-6 items-center transition-colors duration-150 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'truncate font-medium text-foreground' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3.5" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
