import type { DailyContentItem } from '../content/types.js'

/**
 * Which GitBit is "today's" — shared by the in-app Daily feed and the cron
 * job that pushes it (`api/daily-push.ts`), so the notification always
 * names the same bit the page shows.
 *
 * IMPORTANT: this file and `src/content/daily` are compiled a second time,
 * by Vercel, as part of the cron function — per-file with `tsc` under
 * `moduleResolution: node16`, NOT bundled. Two rules follow, and breaking
 * either one fails only at runtime in production (ERR_MODULE_NOT_FOUND,
 * surfacing as FUNCTION_INVOCATION_FAILED):
 *   - no `@/*` alias imports; Vercel resolves neither the types nor the
 *     emit, so use relative paths here even though the rest of `src/` uses
 *     the alias
 *   - relative imports need an explicit `.js` extension, which is also what
 *     the app's own `moduleResolution: bundler` expects
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

/** Hour (UTC) the daily push goes out — must match the `crons` schedule in vercel.json. */
export const DAILY_PUSH_UTC_HOUR = 9

export interface SentDailyItem {
  item: DailyContentItem
  /** When that day's push was scheduled to go out. */
  sentAt: Date
}

/**
 * The bits already pushed on the most recent `count` days, newest first —
 * today's is included only once its push time has passed. Derived from the
 * same rotation as `selectDailyItem`, so the bell's list names exactly what
 * the cron sent (one-off `message=` announcements aren't in it).
 */
export function recentSentDailyItems(items: DailyContentItem[], count: number, now: Date = new Date()): SentDailyItem[] {
  const rotation = getDailyRotation(items)
  if (rotation.length === 0) return []
  const today = utcDayNumber(now)
  const firstDay = now.getUTCHours() >= DAILY_PUSH_UTC_HOUR ? today : today - 1
  return Array.from({ length: count }, (_, offset) => {
    const day = firstDay - offset
    return {
      item: rotation[day % rotation.length],
      sentAt: new Date(day * 86_400_000 + DAILY_PUSH_UTC_HOUR * 3_600_000),
    }
  })
}
