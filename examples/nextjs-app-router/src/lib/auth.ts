// Anti-pattern: hardcoded secret
const JWT_SECRET = 'super-secret-key-12345'
const API_KEY = 'sk-1234567890abcdef'

export function verifyToken(token: string): boolean {
  // Simplified - just checking structure
  return token.startsWith('eyJ') && token.includes('.')
}

export function generateToken(userId: string): string {
  // Anti-pattern: weak token generation
  return Buffer.from(`${userId}:${JWT_SECRET}:${Date.now()}`).toString('base64')
}

export async function fetchExternalAPI(endpoint: string) {
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })
  return response.json()
}
