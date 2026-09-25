import { Link } from 'react-router-dom'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { navModules } from '@/app/navigation'
import { Heading, Text } from '@/components/ui/Typography'
import { ButtonLink } from '@/components/ui/Button'
import { cardClassName } from '@/components/ui/Card'
import { ModuleCard } from '@/components/cards'
import { ahaCards } from '@/services/content'

export default function HomePage() {
  const featuredAha = ahaCards[0]

  return (
    <div className="page-subgrid gap-y-10">
      {/* Full-bleed ink band (see page-grid in base.css): the one inverted surface, where lime carries text — the same ink/lime pair as the logo. */}
      <section className="full-bleed relative -mt-6 overflow-hidden bg-feature px-4 py-10 text-center text-feature-text sm:-mt-8 sm:px-6 sm:py-14">
        <div className="bg-grid bg-grid-feature absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
          <Text variant="caption" className="font-mono font-bold tracking-widest text-highlight uppercase">
            Git, one bit at a time.
          </Text>
          <Heading level={1} className="text-3xl text-feature-text md:text-4xl">
            Finally understand what <span className="text-highlight">Git</span> is doing.
          </Heading>
          <Text variant="body-lg" className="max-w-xl text-feature-text-secondary">
            GitBit bridges Git terminology, plain English, and real mental models — so commands stop being magic
            incantations and start making sense.
          </Text>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
            {/* Lime border: the default ink one disappears into the ink hero, shrinking the lime by 2px a side next to "Browse commands"; lime keeps it one solid block. */}
            <ButtonLink
              to="/learn"
              variant="highlight"
              size="lg"
              trailingIcon={<ArrowRight aria-hidden="true" />}
              className="border-highlight"
            >
              Start learning
            </ButtonLink>
            <ButtonLink to="/quick" variant="inverse" size="lg">
              Browse commands
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Heading level={2} size={3}>
          Everything GitBit
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navModules.map((mod) => (
            <ModuleCard key={mod.to} to={mod.to} icon={mod.icon} title={`GitBit ${mod.label}`} description={mod.description} />
          ))}
        </div>
      </section>

      {featuredAha && (
        <Link
          to={`/aha/${featuredAha.slug}`}
          className={cardClassName(true, 'group flex items-center gap-4 p-5 sm:p-6')}
        >
          <span className="flex size-10 shrink-0 items-center justify-center bg-accent text-on-accent">
            <Lightbulb className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Text as="span" variant="caption" className="font-bold tracking-widest uppercase">
              Aha of the moment
            </Text>
            <Text as="span" variant="body-lg" className="font-bold">
              {featuredAha.statement}
            </Text>
          </span>
          <ArrowRight
            className="size-4 shrink-0 text-foreground transition-transform duration-200 ease-standard group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  )
}
