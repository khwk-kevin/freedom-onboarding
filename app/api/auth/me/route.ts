/**
 * GET /api/auth/me
 * Returns the current authenticated merchant (from httpOnly cookie).
 * Used by the client to identify the user in PostHog after SSO redirect.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.')
  if (!payload) return {}
  const padded = payload + '=='.slice(0, (4 - (payload.length % 4)) % 4)
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'))
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cognito_access_token')?.value
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const claims = decodeJwtPayload(token)
    const cognitoSub = claims.sub as string | undefined
    if (!cognitoSub) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, email, business_name, onboarding_status, auth_provider')
      .eq('cognito_user_id', cognitoSub)
      .single()

    if (!merchant) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      merchantId: merchant.id,
      email: merchant.email,
      name: merchant.business_name,
      onboardingStatus: merchant.onboarding_status,
      authProvider: merchant.auth_provider,
      cognitoSub,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
