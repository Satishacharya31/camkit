import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Check if user exists in admin whitelist
    const adminEntry = await prisma.adminWhitelist.findUnique({
      where: { email }
    });

    if (!adminEntry) {
      return res.status(404).json({ error: 'User not found in admin whitelist' })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Invalidate any existing tokens for this email
    await prisma.passwordSetupToken.updateMany({
      where: { 
        email,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      data: { used: true }
    })

    // Create new token
    const setupToken = await prisma.passwordSetupToken.create({
      data: {
        token,
        email,
        expiresAt
      }
    })

    // Generate setup link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const setupLink = `${baseUrl}/auth/setup-password?token=${token}`

    res.status(200).json({
      message: 'Password setup link generated successfully',
      setupLink,
      expiresAt,
      tokenId: setupToken.id
    })

  } catch (error) {
    console.error('Error generating password setup link:', error)
    res.status(500).json({
      error: 'Failed to generate password setup link',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}