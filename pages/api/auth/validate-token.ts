import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // Find token in database
    const setupToken = await prisma.passwordSetupToken.findUnique({
      where: { token }
    })

    if (!setupToken) {
      return res.status(404).json({ error: 'Invalid token' })
    }

    if (setupToken.used) {
      return res.status(400).json({ error: 'Token has already been used' })
    }

    if (setupToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token has expired' })
    }

    // Token is valid, return success with email
    res.status(200).json({
      valid: true,
      email: setupToken.email,
      expiresAt: setupToken.expiresAt
    })

  } catch (error) {
    console.error('Error validating token:', error)
    res.status(500).json({
      error: 'Failed to validate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}