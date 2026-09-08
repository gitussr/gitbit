import type { DailyContentItem } from '@/content/types'

/**
 * Which GitBit is "today's" — shared by the in-app Daily feed and the cron
 * job that pushes it (`api/daily-push.ts`), so the notification always
 * names the same bit the page shows.
 *
 * IMPORTANT: every import in this file (and in `@/content/daily`, which the
 * cron job also pulls in) must stay type-only. The Vercel function bundles
 * these modules with esbuild, which erases `import type` but cannot resolve
 * the `@/*` path alias.
 */

/** Whole days since the Unix epoch, in UTC. */
export function utcDayNumber(now: Date = new Date()): number {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000)
}

/**
 * Only push-eligible items can be "today's" bit. Items flagged
 * `notificationEligible: false` are too long for a push banner, so letting
 * one become the headline would mean either a silent day or a push that
 * disagrees with the page — they stay in the feed below instead.
 */
export function getDailyRotation(items: DailyContentItem[]): DailyContentItem[] {
  return items.filter((item) => item.notificationEligible)
}

/**
 * UTC-pinned so the browser and the cron job (which has no local timezone)
 * land on the same item. Local time would hand users east or west of the
 * server a different bit than the one that was pushed.
 */
export function selectDailyItem(items: DailyContentItem[], now: Date = new Date()): DailyContentItem | undefined {
  const rotation = getDailyRotation(items)
  if (rotation.length === 0) return undefined
  return rotation[utcDayNumber(now) % rotation.length]
}
