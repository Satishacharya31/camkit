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
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // Find and validate token
    const setupToken = await prisma.passwordSetupToken.findUnique({
      where: { token }
    })

    if (!setupToken) {
      return res.status(404).json({ error: 'Invalid or expired token' })
    }

    if (setupToken.used) {
      return res.status(400).json({ error: 'Token has already been used' })
    }

    if (setupToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token has expired' })
    }

    try {
      // Dynamic import bcrypt
      const bcrypt = await import('bcryptjs')
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Update user with new password
      await prisma.user.upsert({
        where: { email: setupToken.email },
        update: {
          password: hashedPassword,
          role: 'ADMIN'
        },
        create: {
          email: setupToken.email,
          password: hashedPassword,
          role: 'ADMIN'
        }
      })

      // Mark token as used
      await prisma.passwordSetupToken.update({
        where: { token },
        data: { used: true }
      })

      res.status(200).json({
        message: 'Password set successfully',
        email: setupToken.email
      })

    } catch (importError) {
      console.error('bcrypt not available:', importError)
      return res.status(500).json({
        error: 'Password hashing not available. Please install bcryptjs package.',
        details: 'Run: npm install bcryptjs @types/bcryptjs'
      })
    }

  } catch (error) {
    console.error('Error setting password:', error)
    res.status(500).json({
      error: 'Failed to set password',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}