import { NextRequest, NextResponse } from 'next/server'
import { createFreedomAccount, authenticateCognito } from '@/lib/cognito/signup'
import { createServiceClient } from '@/lib/supabase/server'

// Rate limiting: in-memory sliding window
const signupAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = signupAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// Slack notify stub — implemented in Sprint 10
async function notifySlack(_payload: {
  type: string
  merchant: { email: string; id: string }
  channel: string
}) {
  // TODO: Sprint 10 — Slack notification
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_BD_CHANNEL_ID) {
    // Will be implemented in Sprint 10
  }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Try again later.' },
      { status: 429 }
    )
  }

  let body: { email?: string; password?: string; utmParams?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password, utmParams } = body

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: 'Invalid email or password (min 8 chars)' },
      { status: 400 }
    )
  }

  try {
    // 1. Create Freedom World account
    const { refCode } = await createFreedomAccount(email, password)

    // 2. Authenticate to get Cognito tokens
    const { accessToken, idToken, refreshToken, cognitoSub } =
      await authenticateCognito(email, password)

    // 3. Create merchant record in Supabase
    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: merchant, error } = await (supabase as any)
      .from('merchants')
      .insert({
        email,
        cognito_user_id: cognitoSub,
        cognito_email: email,
        ref_code: refCode,
        onboarding_status: 'signup',
        onboarding_started_at: new Date().toISOString(),
        utm_source: utmParams?.utm_source || null,
        utm_medium: utmParams?.utm_medium || null,
        utm_campaign: utmParams?.utm_campaign || null,
        utm_content: utmParams?.utm_content || null,
        utm_term: utmParams?.utm_term || null,
        utm_vertical: utmParams?.utm_vertical || null,
        referrer_url: utmParams?.referrer || null,
        landing_page: utmParams?.landing_page || null,
        gclid: utmParams?.gclid || null,
        fbclid: utmParams?.fbclid || null,
        status: 'lead',
      })
      .select()
      .single()

    if (error) throw error

    // 4. Log signup event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('events').insert({
      merchant_id: merchant.id,
      event_type: 'signup_complete',
      event_data: { refCode, cognito_sub: cognitoSub },
      utm_source: utmParams?.utm_source,
      utm_medium: utmParams?.utm_medium,
      utm_campaign: utmParams?.utm_campaign,
    })

    // 5. Notify Slack (stub until Sprint 10)
    await notifySlack({
      type: 'signup',
      merchant: { email, id: merchant.id },
      channel: utmParams?.utm_source || 'direct',
    })

    // 6. Set tokens as httpOnly cookies — NOT in response body
    const response = NextResponse.json({
      success: true,
      merchantId: merchant.id,
    })

    response.cookies.set('cognito_access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    })
    response.cookies.set('cognito_id_token', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    })
    response.cookies.set('cognito_refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message === 'ACCOUNT_EXISTS') {
      return NextResponse.json(
        { error: 'Account already exists. Please sign in.' },
        { status: 409 }
      )
    }

    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
