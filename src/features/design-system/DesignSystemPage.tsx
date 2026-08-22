import { useState } from 'react'
import { GitBranch, Terminal as TerminalIcon } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Badge, DangerBadge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/SearchInput'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { CommandBlock } from '@/components/ui/CommandBlock'
import { TerminalBlock } from '@/components/ui/TerminalBlock'
import { Alert } from '@/components/ui/Alert'
import { Tooltip } from '@/components/ui/Tooltip'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Pagination } from '@/components/ui/Pagination'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CommandCard, LessonCard, AhaTile, QuizCard, SosCard } from '@/components/cards'
import type { GitCommand, GitConcept, AhaCard as AhaCardContent, QuizQuestion, SosGuide } from '@/content/types'

const sampleCommand: GitCommand = {
  slug: 'git-status',
  command: 'git status',
  humanMeaning: '"What is going on right now?"',
  technicalMeaning: 'Shows the state of the working tree and staging area.',
  whenToUse: 'When you are unsure what changed since your last commit.',
  syntax: 'git status',
  example: 'git status',
  whatHappens: 'Git compares the working directory, staging area, and last commit.',
  mentalModel: 'Ask Git for a status report.',
  dangerLevel: 'safe',
  relatedCommands: ['git diff', 'git log'],
}

const sampleConcept: GitConcept = {
  slug: 'staging-area',
  term: 'Staging Area',
  category: 'core-concept',
  plainEnglish: "The changes you've chosen for your next snapshot.",
  mentalModel: 'A waiting room for your next snapshot.',
  technicalExplanation: 'An index file that tracks what will go into the next commit.',
  difficulty: 'beginner',
}

const sampleAha: AhaCardContent = {
  slug: 'commit-not-save',
  statement: 'A commit is not a save button.',
  explanation: 'Saving keeps a file on disk. A commit records a snapshot of your whole project, on purpose.',
}

const sampleQuiz: QuizQuestion = {
  slug: 'what-command-for-diff',
  prompt: 'You edited index.html and want Git to tell you what changed. Which command should you use?',
  choices: ['git diff', 'git status', 'git log', 'git show'],
  correctIndex: 0,
  explanation: 'git diff shows the exact line-by-line changes in your working directory.',
  difficulty: 'beginner',
}

const sampleSos: SosGuide = {
  slug: 'accidentally-staged-a-file',
  situation: 'I accidentally staged a file',
  reassurance: "Don't worry — unstaging doesn't lose any work.",
  steps: [{ instruction: 'Unstage the file', command: 'git restore --staged <file>' }],
  dangerLevel: 'safe',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-10">
      <Heading level={2}>{title}</Heading>
      {children}
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-14 rounded-md border border-border ${className}`} />
      <Text variant="caption" tone="tertiary" className="font-mono">
        {name}
      </Text>
    </div>
  )
}

export default function DesignSystemPage() {
  const [tab, setTab] = useState('safe')
  const [page, setPage] = useState(2)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const toast = useToast()

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Heading level={1}>Design System</Heading>
        <Text tone="secondary" className="mt-2">
          Every token and primitive GitBit is built from (Section 11). If a screen needs something not shown here,
          extend this system first.
        </Text>
      </div>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="background" className="bg-background" />
          <Swatch name="background-subtle" className="bg-background-subtle" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="accent" className="bg-accent" />
          <Swatch name="safe" className="bg-safe-subtle border-safe-border" />
          <Swatch name="caution" className="bg-caution-subtle border-caution-border" />
          <Swatch name="danger" className="bg-danger-subtle border-danger-border" />
          <Swatch name="border" className="bg-background border-border-strong" />
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          {/* Rendered as <p>/<div> here so the showcase itself keeps one true h1 per page (Section 24) */}
          <Heading level={1} as="p">
            Heading level 1 — Manrope
          </Heading>
          <Heading level={2} as="p">
            Heading level 2
          </Heading>
          <Heading level={3} as="p">
            Heading level 3
          </Heading>
          <Heading level={4} as="p">
            Heading level 4
          </Heading>
          <Text variant="body-lg">Body large — used for lesson lead paragraphs.</Text>
          <Text variant="body">Body — the default paragraph size across GitBit.</Text>
          <Text variant="body-sm" tone="secondary">
            Body small, secondary tone — metadata and captions.
          </Text>
          <code className="font-mono text-sm text-accent">git commit -m "Add login page" — Ubuntu Mono</code>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" leadingIcon={<GitBranch className="size-4" aria-hidden="true" />}>
            With icon
          </Button>
          <IconButton icon={<TerminalIcon aria-hidden="true" />} label="Open terminal" variant="secondary" />
        </div>
      </Section>

      <Section title="Badges, tags &amp; danger levels">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">core-concept</Badge>
          <Badge variant="accent">everyday</Badge>
          <DangerBadge level="safe" />
          <DangerBadge level="caution" />
          <DangerBadge level="high-caution" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag selected>Beginner</Tag>
          <Tag>Intermediate</Tag>
          <Tag>Advanced</Tag>
        </div>
      </Section>

      <Section title="Inputs &amp; search">
        <div className="grid max-w-md gap-4">
          <Input label="Commit message" placeholder="Add login page" />
          <Input label="With error" defaultValue="a" error="Commit messages need more detail than that." />
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} shortcutHint="⌘K" />
        </div>
      </Section>

      <Section title="Code, command &amp; terminal blocks">
        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock label="package.json" code={'{\n  "name": "gitbit"\n}'} />
          <CommandBlock
            command='git commit -m "Add login page"'
            anatomy={[
              { token: 'git', explanation: 'The Git program.' },
              { token: 'commit', explanation: 'Create a commit / checkpoint.' },
              { token: '-m', explanation: 'Provide a commit message.' },
              { token: '"Add login page"', explanation: 'Describe what the checkpoint represents.' },
            ]}
          />
        </div>
        <TerminalBlock
          command="git status"
          gitSays="You have changed 2 files."
          humanTranslation="Something changed after your last checkpoint."
        />
      </Section>

      <Section title="Alerts">
        <div className="flex flex-col gap-3">
          <Alert variant="info" title="Did you know?">
            You can use Git without GitHub.
          </Alert>
          <Alert variant="success" title="You're safe">
            Unstaging a file never loses your work.
          </Alert>
          <Alert variant="warning" title="Understand before using">
            git reset changes history — read what it does first.
          </Alert>
          <Alert variant="danger" title="High caution">
            git push --force can overwrite remote history.
          </Alert>
        </div>
      </Section>

      <Section title="Tabs, breadcrumbs &amp; pagination">
        <Breadcrumbs items={[{ label: 'Learn', to: '/learn' }, { label: 'Branching', to: '/learn/level-3' }, { label: 'Merge' }]} />
        <Tabs
          items={[
            { value: 'safe', label: 'Safe' },
            { value: 'caution', label: 'Understand first' },
            { value: 'danger', label: 'High caution' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <TabPanel value="safe" activeValue={tab}>
          <Text tone="secondary">git status, git diff, git log — read-only, nothing to undo.</Text>
        </TabPanel>
        <TabPanel value="caution" activeValue={tab}>
          <Text tone="secondary">git reset, git revert, git rebase, git stash — know what they do first.</Text>
        </TabPanel>
        <TabPanel value="danger" activeValue={tab}>
          <Text tone="secondary">git reset --hard, git push --force, git clean — can discard work.</Text>
        </TabPanel>
        <Pagination page={page} totalPages={6} onPageChange={setPage} />
        <div className="flex items-center gap-4">
          <ProgressRing value={25} />
          <ProgressRing value={60} />
          <ProgressRing value={100} />
        </div>
      </Section>

      <Section title="Tooltip, dialog &amp; toast">
        <div className="flex flex-wrap items-center gap-4">
          <Tooltip content="Shows the working tree and staging area status.">
            <Button variant="secondary">Hover / focus me</Button>
          </Tooltip>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: 'Copied', description: 'git status copied to clipboard.', variant: 'success' })}>
            Show toast
          </Button>
        </div>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Undo local changes">
          <Text tone="secondary">This restores the file to its last committed state. Uncommitted edits are lost.</Text>
        </Dialog>
      </Section>

      <Section title="Empty, loading &amp; error states">
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState title="No results" description="Try a different search term." />
          <LoadingState rows={2} />
          <ErrorState onRetry={() => {}} />
        </div>
      </Section>

      <Section title="Content cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CommandCard command={sampleCommand} />
          <LessonCard concept={sampleConcept} levelSlug="level-1-everyday-git" />
          <AhaTile aha={sampleAha} />
          <QuizCard quiz={sampleQuiz} />
          <SosCard guide={sampleSos} />
          <Card className="flex items-center justify-center text-foreground-tertiary">Daily card — Phase 5</Card>
        </div>
      </Section>
    </div>
  )
}
