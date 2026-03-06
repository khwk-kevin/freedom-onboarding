import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js'

const COGNITO_CONFIG = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!, // ap-southeast-1_vrFtW6HMa
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,      // 3l2f2po0frgcmuca646g84uvkh
}

const FREEDOM_API = process.env.FREEDOM_API_BASE_URL!  // https://gateway.freedom.world
const FREEDOM_APP_KEY = process.env.FREEDOM_APP_KEY!   // fdw_app

// ─── Step 1: Create Freedom World account ───
export async function createFreedomAccount(email: string, password: string) {
  const response = await fetch(`${FREEDOM_API}/api/freedom-user/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      appKey: FREEDOM_APP_KEY,
      silent: true,
      meta: { autoCreateWallet: true },
    }),
  })

  const data = await response.json()

  if (!data.success) {
    if (data.action === 'existing-user') {
      throw new Error('ACCOUNT_EXISTS')
    }
    throw new Error(data.message || 'Signup failed')
  }

  return {
    refCode: data.refCode,
    action: data.action, // 'new-signup'
  }
}

// ─── Step 2: Authenticate via SRP (get Cognito tokens) ───
export async function authenticateCognito(
  email: string,
  password: string
): Promise<{
  accessToken: string
  idToken: string
  refreshToken: string
  cognitoSub: string
}> {
  return new Promise((resolve, reject) => {
    const pool = new CognitoUserPool(COGNITO_CONFIG)
    const user = new CognitoUser({ Username: email, Pool: pool })
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    })

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          cognitoSub: session.getIdToken().payload.sub,
        })
      },
      onFailure: (err) => reject(err),
    })
  })
}

// ─── Step 3: Token refresh ───
export async function refreshCognitoTokens(
  email: string,
  storedRefreshToken: string
): Promise<{
  accessToken: string
  idToken: string
}> {
  return new Promise((resolve, reject) => {
    const pool = new CognitoUserPool(COGNITO_CONFIG)
    const user = new CognitoUser({ Username: email, Pool: pool })
    const token = new CognitoRefreshToken({ RefreshToken: storedRefreshToken })

    user.refreshSession(token, (err: Error | null, session: any) => {
      if (err) return reject(err)
      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
      })
    })
  })
}
