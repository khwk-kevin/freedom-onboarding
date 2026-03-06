import { NextRequest, NextResponse } from 'next/server'
import {
  notifySignup,
  notifyOnboardComplete,
  notifyHandoff,
  notifyDormancy,
  notifyWeeklySummary,
  type MerchantNotificationData,
  type HandoffNotificationData,
  type StatsNotificationData,
} from '@/lib/slack/notify'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/utils/rate-limit'

/**
 * POST /api/slack/notify
 * Formats and sends Slack notifications by type.
 * Called internally by other API routes.
 *
 * Body: { type, merchant?, handoff?, channel?, stats? }
 */
export async function POST(req: NextRequest) {
  // Rate limit: 20 Slack notifications per minute per IP (internal calls, low volume)
  const ip = getClientIp(req)
  const rl = rateLimit(`${ip}:slack-notify`, { limit: 20, windowMs: 60_000 })
  if (!rl.success) return rateLimitResponse(rl)

  const body = await req.json()
  const {
    type,
    merchant,
    handoff,
    channel,
    stats,
  } = body as {
    type: 'signup' | 'onboard_complete' | 'handoff' | 'dormancy' | 'weekly_summary'
    merchant?: MerchantNotificationData
    handoff?: HandoffNotificationData
    channel?: string
    stats?: StatsNotificationData
  }

  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 })
  }

  try {
    let result: { ok: boolean; ts?: string; error?: string }

    switch (type) {
      case 'signup': {
        if (!merchant) {
          return NextResponse.json({ error: 'Missing merchant for signup notification' }, { status: 400 })
        }
        result = await notifySignup(merchant, channel)
        break
      }

      case 'onboard_complete': {
        if (!merchant) {
          return NextResponse.json({ error: 'Missing merchant for onboard_complete notification' }, { status: 400 })
        }
        result = await notifyOnboardComplete(merchant)
        break
      }

      case 'handoff': {
        if (!merchant || !handoff) {
          return NextResponse.json(
            { error: 'Missing merchant or handoff for handoff notification' },
            { status: 400 }
          )
        }
        result = await notifyHandoff(merchant, handoff)
        break
      }

      case 'dormancy': {
        if (!merchant) {
          return NextResponse.json({ error: 'Missing merchant for dormancy notification' }, { status: 400 })
        }
        result = await notifyDormancy(merchant)
        break
      }

      case 'weekly_summary': {
        if (!stats) {
          return NextResponse.json({ error: 'Missing stats for weekly_summary notification' }, { status: 400 })
        }
        result = await notifyWeeklySummary(stats)
        break
      }

      default:
        return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 })
    }

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ts: result.ts })
  } catch (err) {
    console.error('[slack/notify POST] Error:', err)
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 })
  }
}
