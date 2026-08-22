import { Link } from 'react-router-dom'
import { Terminal, BookOpen, Lightbulb, HelpCircle, LifeBuoy, TerminalSquare, Bell, ArrowRight } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { cardClassName } from '@/components/ui/Card'
import { ahaCards } from '@/services/content'

const modules = [
  { to: '/quick', icon: Terminal, title: 'GitBit Quick', description: 'Fast, searchable command cheat sheet.' },
  { to: '/learn', icon: BookOpen, title: 'GitBit Learn', description: 'A structured path from basics to branching.' },
  { to: '/aha', icon: Lightbulb, title: 'GitBit Aha', description: 'Short ideas that fix a wrong mental model.' },
  { to: '/quiz', icon: HelpCircle, title: 'GitBit Quiz', description: 'Knowledge checks that test understanding.' },
  { to: '/sos', icon: LifeBuoy, title: 'GitBit SOS', description: '"I messed up Git." Calm, step-by-step fixes.' },
  { to: '/terminal', icon: TerminalSquare, title: 'GitBit Terminal', description: 'See what a command actually does.' },
  { to: '/daily', icon: Bell, title: 'GitBit Daily', description: 'One small, useful thing about Git — daily.' },
]

export default function HomePage() {
  const featuredAha = ahaCards[0]

  return (
    <div className="flex flex-col gap-16">
      <section className="relative -mx-4 overflow-hidden rounded-2xl px-4 py-16 text-center sm:-mx-6 sm:px-6 sm:py-24">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="hero-gradient absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-6">
          <Text variant="caption" className="font-mono tracking-wide text-accent uppercase">
            Git, one bit at a time.
          </Text>
          <Heading level={1} className="max-w-2xl text-4xl sm:text-5xl">
            Finally understand what Git is doing.
          </Heading>
          <Text variant="body-lg" tone="secondary" className="max-w-xl">
            GitBit bridges Git terminology, plain English, and real mental models — so commands stop being magic
            incantations and start making sense.
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/learn">
              <Button size="lg">Start learning</Button>
            </Link>
            <Link to="/quick">
              <Button size="lg" variant="secondary">
                Browse commands
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <Heading level={2}>Everything GitBit</Heading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link key={mod.to} to={mod.to} className={cardClassName(true, 'flex flex-col gap-3')}>
              <mod.icon className="size-6 text-accent" aria-hidden="true" />
              <Heading level={4}>{mod.title}</Heading>
              <Text variant="body-sm" tone="secondary">
                {mod.description}
              </Text>
            </Link>
          ))}
        </div>
      </section>

      {featuredAha && (
        <section className="flex flex-col items-center gap-4 rounded-xl border border-accent-border bg-accent-subtle p-8 text-center">
          <Lightbulb className="size-7 text-accent-strong" aria-hidden="true" />
          <Text variant="body-lg" className="max-w-lg text-xl font-semibold text-foreground">
            {featuredAha.statement}
          </Text>
          <Link to={`/aha/${featuredAha.slug}`}>
            <Button variant="ghost" trailingIcon={<ArrowRight aria-hidden="true" />}>
              See why
            </Button>
          </Link>
        </section>
      )}
    </div>
  )
}
