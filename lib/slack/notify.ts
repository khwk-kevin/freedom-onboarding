/**
 * Slack notification utilities for Freedom World BD team
 * Channel: #bdteam-updates (C041LC6QTL4)
 *
 * If SLACK_BOT_TOKEN is not set, falls back to console.log
 */

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_BD_CHANNEL = process.env.SLACK_BD_CHANNEL_ID || 'C041LC6QTL4'
const CRM_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://onboarding.freedom.world'

interface SlackBlock {
  type: string
  text?: { type: string; text: string; emoji?: boolean }
  fields?: { type: string; text: string }[]
  elements?: unknown[]
  accessory?: unknown
}

interface SlackMessage {
  channel: string
  text: string  // Fallback text for notifications
  blocks?: SlackBlock[]
}

/**
 * Send a message to Slack via the Web API.
 * Falls back to console.log if no SLACK_BOT_TOKEN.
 */
export async function sendSlackMessage(message: SlackMessage): Promise<{
  ok: boolean
  ts?: string
  error?: string
}> {
  if (!SLACK_BOT_TOKEN) {
    console.log('[SLACK_NOTIFY] No SLACK_BOT_TOKEN — logging instead:')
    console.log('[SLACK_NOTIFY]', message.text)
    return { ok: true }
  }

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(message),
    })

    const data = await res.json()

    if (!data.ok) {
      console.error('[SLACK_NOTIFY] Slack API error:', data.error)
      return { ok: false, error: data.error }
    }

    return { ok: true, ts: data.ts }
  } catch (err) {
    console.error('[SLACK_NOTIFY] Network error:', err)
    return { ok: false, error: 'Network error' }
  }
}

// ─── Typed notification functions ───────────────────────────

export interface MerchantNotificationData {
  id: string
  email: string
  business_name?: string | null
  business_type?: string | null
  utm_source?: string | null
  onboarding_status?: string
  onboarding_last_phase_at?: string | null
}

export interface HandoffNotificationData {
  reason: string
  reason_category?: string | null
  stuck_at_phase?: string | null
  handoff_id?: string
}

export interface StatsNotificationData {
  signups: number
  onboarded: number
  completionRate: number
  active: number
  handoffs: number
  topChannel: string
}

/**
 * Notify: new merchant signup
 */
export async function notifySignup(
  merchant: MerchantNotificationData,
  channel?: string
) {
  const source = channel || merchant.utm_source || 'direct'
  const text = `📝 *New merchant signup:* ${merchant.email} via ${source}`

  return sendSlackMessage({
    channel: SLACK_BD_CHANNEL,
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📝 *New merchant signup*\n*Email:* ${merchant.email}\n*Source:* ${source}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in CRM', emoji: true },
            url: `${CRM_BASE_URL}/crm/merchants/${merchant.id}`,
            style: 'primary',
          },
        ],
      },
    ],
  })
}

/**
 * Notify: merchant completed onboarding
 */
export async function notifyOnboardComplete(merchant: MerchantNotificationData) {
  const text =
    `🎉 *Merchant onboarded:* ${merchant.business_name || merchant.email} ` +
    `| Type: ${merchant.business_type || 'unknown'} | Source: ${merchant.utm_source || 'direct'}`

  return sendSlackMessage({
    channel: SLACK_BD_CHANNEL,
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `🎉 *Merchant onboarded!*\n` +
            `*Business:* ${merchant.business_name || merchant.email}\n` +
            `*Type:* ${merchant.business_type || 'unknown'}\n` +
            `*Source:* ${merchant.utm_source || 'direct'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in CRM', emoji: true },
            url: `${CRM_BASE_URL}/crm/merchants/${merchant.id}`,
            style: 'primary',
          },
        ],
      },
    ],
  })
}

/**
 * Notify: merchant needs human help (handoff)
 */
export async function notifyHandoff(
  merchant: MerchantNotificationData,
  handoff: HandoffNotificationData
) {
  const text =
    `⚠️ *Merchant needs help:* ${merchant.business_name || merchant.email} ` +
    `| Stuck at: ${handoff.stuck_at_phase} | Reason: ${handoff.reason}`

  return sendSlackMessage({
    channel: SLACK_BD_CHANNEL,
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `⚠️ *Merchant needs help*\n` +
            `*Merchant:* ${merchant.business_name || merchant.email}\n` +
            `*Stuck at phase:* ${handoff.stuck_at_phase || 'unknown'}\n` +
            `*Reason:* ${handoff.reason}\n` +
            `*Category:* ${handoff.reason_category || 'other'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open CRM', emoji: true },
            url: `${CRM_BASE_URL}/crm/merchants/${merchant.id}`,
            style: 'danger',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Handoff Queue', emoji: true },
            url: `${CRM_BASE_URL}/crm/handoffs`,
          },
        ],
      },
    ],
  })
}

/**
 * Notify: dormant merchant (incomplete onboarding 3+ days)
 */
export async function notifyDormancy(merchant: MerchantNotificationData) {
  const text =
    `💤 *Incomplete onboarding (3+ days):* ${merchant.business_name || merchant.email} ` +
    `| Last phase: ${merchant.onboarding_status}`

  return sendSlackMessage({
    channel: SLACK_BD_CHANNEL,
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `💤 *Incomplete onboarding (3+ days)*\n` +
            `*Merchant:* ${merchant.business_name || merchant.email}\n` +
            `*Last phase:* ${merchant.onboarding_status}\n` +
            `*Last activity:* ${merchant.onboarding_last_phase_at || 'unknown'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in CRM', emoji: true },
            url: `${CRM_BASE_URL}/crm/merchants/${merchant.id}`,
          },
        ],
      },
    ],
  })
}

/**
 * Notify: weekly pipeline summary
 */
export async function notifyWeeklySummary(stats: StatsNotificationData) {
  const text =
    `📊 *Weekly Pipeline Summary* | ` +
    `Signups: ${stats.signups} | Onboarded: ${stats.onboarded} | ` +
    `Rate: ${stats.completionRate}% | Active: ${stats.active}`

  return sendSlackMessage({
    channel: SLACK_BD_CHANNEL,
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `📊 *Weekly Pipeline Summary*\n` +
            `*New signups:* ${stats.signups}\n` +
            `*Completed onboarding:* ${stats.onboarded}\n` +
            `*Completion rate:* ${stats.completionRate}%\n` +
            `*Active merchants:* ${stats.active}\n` +
            `*Handoffs this week:* ${stats.handoffs}\n` +
            `*Top channel:* ${stats.topChannel}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
            url: `${CRM_BASE_URL}/crm`,
            style: 'primary',
          },
        ],
      },
    ],
  })
}
