type FirebaseAccount = {
  customAttributes?: string
}

export async function verifyAdminToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) throw new Error('Firebase API key is not configured.')

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    }
  )

  if (!response.ok) throw new Error('Invalid or expired authentication token.')

  const data = await response.json() as { users?: FirebaseAccount[] }
  const account = data.users?.[0]
  if (!account) throw new Error('Firebase account was not found.')

  let claims: Record<string, unknown> = {}
  if (account.customAttributes) {
    try {
      claims = JSON.parse(account.customAttributes) as Record<string, unknown>
    } catch {
      throw new Error('Firebase account claims are invalid.')
    }
  }

  return claims.admin === true
}
