import { CompassIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={<CompassIcon className="size-7" aria-hidden="true" />}
      title="This page doesn't exist"
      description="It might have moved, or the link might be off."
      action={
        <ButtonLink to="/" variant="secondary">
          Back to GitBit
        </ButtonLink>
      }
    />
  )
}
