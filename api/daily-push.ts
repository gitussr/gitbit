import type { VercelRequest, VercelResponse } from '@vercel/node'
import { dailyContent } from '../src/content/daily/index.js'
import { selectDailyItem } from '../src/services/dailySelection.js'

/**
 * The sender half of GitBit Daily (Product Spec Section 9 — "notification
 * generation" and "notification scheduling"). Everything else already
 * existed: the client subscribes via NotificationService, and OneSignal
 * delivers. Nothing ever *asked* it to, so pushes only went out when
 * someone clicked Send in the OneSignal dashboard.
 *
 * Invoked once a day by the Vercel cron entry in `vercel.json`. Crons only
 * run against Production deployments — a preview deploy will never fire
 * this, which is the intended behaviour (one push per day, not one per
 * branch).
 */

const ONESIGNAL_API = 'https://api.onesignal.com/notifications'

/**
 * Must match a segment in OneSignal > Audience > Segments *exactly*. The
 * default differs by app age — newer apps get "Total Subscriptions", older
 * ones "Subscribed Users" — and a name that matches nothing is not an error
 * OneSignal reports as one (see the delivery check below), so it's an env
 * var rather than a constant to guess at. Read per request, like the other
 * env vars, so changing it in Vercel doesn't depend on module load order.
 */
function segment() {
  return process.env.ONESIGNAL_SEGMENT ?? 'Total Subscriptions'
}

/** Push banners collapse newlines anyway; do it up front so the text reads as one sentence. */
function toBannerText(body: string): string {
  return body.replace(/\s*\n+\s*/g, ' ').trim()
}

function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'https://gitbit-theta.vercel.app'
}

/**
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations
 * whenever that env var is set. Without the check this route is an open
 * "push to every subscriber" button, so an unset secret fails closed
 * rather than leaving it unguarded.
 */
function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.authorization === `Bearer ${secret}`
}

interface DeliveryStats {
  successful: number | null
  failed: number | null
  errored: number | null
  received: number | null
  remaining: number | null
}

/**
 * Reads the notification back so a run records what happened to the push, not
 * merely that OneSignal accepted the request.
 *
 * Best-effort by design: the push has already gone out by the time this runs,
 * so anything that fails here is logged and ignored rather than turned into a
 * failed run — the alternative is reporting a delivered push as broken.
 *
 * Delivery is asynchronous, so straight after a send most of the audience is
 * still counted in `remaining` (and `remaining` is null while OneSignal is
 * still processing). The figure that is meaningful immediately is the
 * audience size, which is why the caller sums the four buckets.
 */
async function readDeliveryStats(id: string, appId: string, apiKey: string): Promise<DeliveryStats | null> {
  try {
    const response = await fetch(`${ONESIGNAL_API}/${id}?app_id=${encodeURIComponent(appId)}`, {
      headers: { Authorization: `Key ${apiKey}` },
    })
    if (!response.ok) {
      console.error(`[GitBit] Could not read delivery stats for ${id}: HTTP ${response.status}`)
      return null
    }
    const body = (await response.json()) as Record<string, unknown>
    const count = (value: unknown) => (typeof value === 'number' ? value : null)
    return {
      successful: count(body.successful),
      failed: count(body.failed),
      errored: count(body.errored),
      received: count(body.received),
      remaining: count(body.remaining),
    }
  } catch (err) {
    console.error(`[GitBit] Could not read delivery stats for ${id}:`, err)
    return null
  }
}

const MAX_MESSAGE_LENGTH = 400

interface RequestOptions {
  dryRun: boolean
  title?: string
  message?: string
}

/**
 * Options come from the query string or a JSON body, so both a quick
 * `curl -G -d` and a scripted POST work. The cron itself sends neither and
 * gets the defaults.
 */
function readOptions(req: VercelRequest): RequestOptions {
  const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Record<string, unknown>
  const pick = (key: string) => {
    const fromQuery = req.query[key]
    const raw = fromQuery ?? body[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    return typeof value === 'string' ? value.trim() || undefined : undefined
  }
  const dryRunRaw = pick('dryRun') ?? (body.dryRun === true ? '1' : undefined)
  return {
    dryRun: dryRunRaw === '1' || dryRunRaw === 'true',
    title: pick('title'),
    message: pick('message'),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAuthorized(req)) {
    if (!process.env.CRON_SECRET) {
      console.error('[GitBit] CRON_SECRET is not set — refusing to send. Add it in the Vercel project env.')
    }
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const appId = process.env.ONESIGNAL_APP_ID ?? process.env.VITE_ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_REST_API_KEY

  if (!appId || !apiKey) {
    console.error('[GitBit] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY — cannot send the daily push.')
    return res.status(500).json({ error: 'OneSignal is not configured' })
  }

  const { dryRun, title, message } = readOptions(req)

  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer`, length: message.length })
  }
  if (title && !message) {
    return res.status(400).json({ error: 'title is only valid alongside message' })
  }

  const site = siteUrl()
  const SEGMENT = segment()

  /**
   * A one-off announcement gets its own `web_push_topic`, so it can't collapse
   * an unread daily bit (or be collapsed by one — sharing a topic means the
   * newer notification replaces the older), and it links to the site root,
   * since an announcement is rarely about the Daily feed specifically.
   */
  let notification: { heading: string; body: string; url: string; topic: string; label: string }

  if (message) {
    notification = {
      heading: title ?? 'GitBit',
      body: message,
      url: site,
      topic: 'gitbit-announcement',
      label: 'announcement',
    }
  } else {
    const today = selectDailyItem(dailyContent)
    if (!today) {
      console.error('[GitBit] No notification-eligible daily content — nothing to send.')
      return res.status(500).json({ error: 'No sendable daily content' })
    }
    notification = {
      heading: today.title,
      body: today.body,
      url: `${site}/daily`,
      // Collapses an undismissed previous day's bit instead of stacking a new
      // one on top of it — the feed is always "today", never a backlog.
      topic: 'gitbit-daily',
      label: today.slug,
    }
  }

  const payload = {
    app_id: appId,
    included_segments: [SEGMENT],
    headings: { en: notification.heading },
    contents: { en: toBannerText(notification.body) },
    url: notification.url,
    chrome_web_icon: `${site}/icons/icon-192.png`,
    web_push_topic: notification.topic,
  }

  /**
   * Everything above this line is the real path — auth, config, content
   * selection, payload — so a dry run answers "would a live call have
   * worked?" for every step except OneSignal's own response. It exists
   * because the only other way to exercise the auth path is to push to every
   * subscriber, which makes verifying something like a rotated CRON_SECRET
   * unnecessarily expensive.
   */
  if (dryRun) {
    console.log(`[GitBit] Dry run OK — would send ${notification.label} to segment "${SEGMENT}". Nothing was sent.`)
    return res.status(200).json({
      dryRun: true,
      sent: null,
      wouldSend: notification.label,
      segment: SEGMENT,
      payload,
    })
  }

  const response = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const result = (await response.json().catch(() => null)) as
    | { id?: string; recipients?: number; errors?: unknown }
    | null

  const notificationId = result?.id || null
  const recipients = typeof result?.recipients === 'number' ? result.recipients : null

  /**
   * A 2xx is NOT evidence of delivery. When a send matches nobody OneSignal
   * answers 200 with a blank `id` and an `errors` array — "All included
   * players are not subscribed" — which is what a SEGMENT that names no real
   * segment looks like. Treating that as success is how a broken push
   * reports itself as sent, so every one of those shapes fails loudly here.
   */
  if (!response.ok || result?.errors || !notificationId || recipients === 0) {
    console.error(
      `[GitBit] Push NOT delivered (${notification.label}, segment "${SEGMENT}", HTTP ${response.status}):`,
      JSON.stringify(result),
    )
    return res.status(502).json({
      error: 'OneSignal did not deliver the notification',
      status: response.status,
      segment: SEGMENT,
      result,
    })
  }

  const delivery = await readDeliveryStats(notificationId, appId, apiKey)
  // `remaining: null` means OneSignal is still processing the send, so the
  // buckets don't add up to the audience yet — report unknown rather than
  // summing to a number that would read as "nobody".
  const audience =
    delivery && delivery.remaining !== null
      ? (delivery.successful ?? 0) + (delivery.failed ?? 0) + (delivery.errored ?? 0) + delivery.remaining
      : null

  console.log(
    `[GitBit] Push sent: ${notification.label} (id ${notificationId}, segment "${SEGMENT}")` +
      (delivery
        ? ` — audience ${audience ?? 'unknown'}, delivered ${delivery.successful ?? 0}, failed ${delivery.failed ?? 0},` +
          ` errored ${delivery.errored ?? 0}, confirmed ${delivery.received ?? 0},` +
          ` remaining ${delivery.remaining ?? 'still processing'}`
        : ' — delivery stats unavailable'),
  )

  return res.status(200).json({
    sent: notification.label,
    notificationId,
    recipients,
    segment: SEGMENT,
    audience,
    delivery,
  })
}
