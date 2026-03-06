// Cognito Hosted UI OAuth2 — Google / Apple / LINE SSO

const COGNITO_DOMAIN = 'auth.freedom.world'
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '3l2f2po0frgcmuca646g84uvkh'

export type SSOProvider = 'Google' | 'SignInWithApple' | 'LINE'

/**
 * Build the Cognito Hosted UI OAuth2 authorize URL.
 * Cognito federates to Google/Apple/LINE and returns an auth code
 * to our callback URL.
 */
export function buildSSOUrl(
  provider: SSOProvider,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    identity_provider: provider,
  })
  if (state) params.set('state', state)
  return `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for Cognito tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string
  id_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}> {
  const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${text}`)
  }

  return res.json()
}

/**
 * Decode a JWT ID token payload (no verification — Cognito already signed it).
 */
export function decodeIdToken(idToken: string): {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  identities?: Array<{ providerName: string; userId: string }>
} {
  const payload = idToken.split('.')[1]
  const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
  return JSON.parse(decoded)
}
