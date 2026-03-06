import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, decodeIdToken } from '@/lib/cognito/sso'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://freedom-onboarding-iota.vercel.app'
  const redirectUri = `${appUrl}/api/auth/callback`

  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${appUrl}/signup?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/signup?error=no_code`)
  }

  try {
    // 1. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    // 2. Decode ID token to get user info
    const userInfo = decodeIdToken(tokens.id_token)
    const { sub: cognitoSub, email, name } = userInfo
    const provider = userInfo.identities?.[0]?.providerName || 'unknown'

    if (!email) {
      return NextResponse.redirect(`${appUrl}/signup?error=no_email`)
    }

    // 3. Create Freedom World account (silent — won't fail if exists)
    let refCode: string | undefined
    try {
      const fwRes = await fetch(
        `${process.env.FREEDOM_API_BASE_URL}/api/freedom-user/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: `SSO_${cognitoSub}_${Date.now()}`, // placeholder — SSO users auth via tokens
            appKey: process.env.FREEDOM_APP_KEY,
            silent: true,
            meta: { autoCreateWallet: true },
          }),
        }
      )
      const fwData = await fwRes.json()
      refCode = fwData.refCode
    } catch (e) {
      console.warn('Freedom account creation skipped:', e)
    }

    // 4. Upsert merchant in Supabase
    const supabase = createServiceClient()

    // Parse UTM params from state (if we encoded them)
    let utmParams: Record<string, string> = {}
    if (state) {
      try {
        utmParams = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'))
      } catch {
        // state wasn't JSON — ignore
      }
    }

    const { data: merchant, error: dbError } = await supabase
      .from('merchants')
      .upsert(
        {
          email,
          cognito_user_id: cognitoSub,
          cognito_email: email,
          business_name: name || null,
          ref_code: refCode || null,
          onboarding_status: 'signup',
          onboarding_started_at: new Date().toISOString(),
          auth_provider: provider,
          utm_source: utmParams.utm_source || null,
          utm_medium: utmParams.utm_medium || null,
          utm_campaign: utmParams.utm_campaign || null,
          status: 'lead',
        },
        { onConflict: 'cognito_user_id' }
      )
      .select()
      .single()

    if (dbError) {
      console.error('Supabase upsert error:', dbError)
      // Don't block login — Supabase tables might not exist yet
    }

    // 5. Log event
    if (merchant) {
      try {
        await supabase.from('events').insert({
          merchant_id: merchant.id,
          event_type: 'sso_signup',
          event_data: { provider, cognito_sub: cognitoSub, ref_code: refCode },
        })
      } catch {
        // ignore if events table doesn't exist yet
      }
    }

    // 6. Set tokens as httpOnly cookies and redirect to onboarding
    const response = NextResponse.redirect(`${appUrl}/onboarding`)

    response.cookies.set('cognito_access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    })
    response.cookies.set('cognito_id_token', tokens.id_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    })
    response.cookies.set('cognito_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    })
    // Store merchant ID in a non-httpOnly cookie so client can read it
    if (merchant?.id) {
      response.cookies.set('merchant_id', merchant.id, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600,
        path: '/',
      })
    }

    return response
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      `${appUrl}/signup?error=${encodeURIComponent(err instanceof Error ? err.message : 'unknown')}`
    )
  }
}
