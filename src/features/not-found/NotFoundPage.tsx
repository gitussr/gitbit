import { Link } from 'react-router-dom'
import { CompassIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={<CompassIcon className="size-8" aria-hidden="true" />}
      title="This page doesn't exist"
      description="It might have moved, or the link might be off."
      action={
        <Link to="/">
          <Button variant="secondary">Back to GitBit</Button>
        </Link>
      }
    />
  )
}
