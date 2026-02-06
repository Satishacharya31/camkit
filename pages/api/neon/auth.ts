import { NextApiRequest, NextApiResponse } from 'next'
import { getNeonAuthService } from '@/lib/neon-auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const neonAuth = getNeonAuthService()

  try {
    const user = await neonAuth.authenticateUser(email, password)

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Return user information (without sensitive data)
    return res.status(200).json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        databaseRole: user.databaseRole,
        hasNeonAccess: !!user.databaseRole
      }
    })

  } catch (error) {
    console.error('Neon authentication error:', error)
    return res.status(500).json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await neonAuth.disconnect()
  }
}