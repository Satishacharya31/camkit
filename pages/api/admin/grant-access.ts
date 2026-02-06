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
    const { 
      email, 
      name,
      generatePasswordLink = true,
      canManageUsers = true, 
      canManageContent = true, 
      canManageSettings = false 
    } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // First, update or create user with ADMIN role
    await prisma.user.upsert({
      where: { email },
      update: { 
        role: 'ADMIN',
        name: name || null
      },
      create: {
        email,
        name: name || null,
        role: 'ADMIN'
      }
    })

    // Then add to admin whitelist
    const adminEntry = await prisma.adminWhitelist.upsert({
      where: { email },
      update: {
        name,
        isActive: true,
        canManageUsers,
        canManageContent,
        canManageSettings,
        notes: `Updated on ${new Date().toISOString()}`
      },
      create: {
        email,
        name,
        isActive: true,
        canManageUsers,
        canManageContent,
        canManageSettings,
        notes: `Added on ${new Date().toISOString()}`
      }
    })

    let passwordSetupLink = null

    // Generate password setup link if requested
    if (generatePasswordLink) {
      try {
        const crypto = await import('crypto')
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        // Invalidate existing tokens
        await prisma.passwordSetupToken.updateMany({
          where: { 
            email,
            used: false,
            expiresAt: { gt: new Date() }
          },
          data: { used: true }
        })

        // Create new token
        await prisma.passwordSetupToken.create({
          data: {
            token,
            email,
            expiresAt
          }
        })

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        passwordSetupLink = `${baseUrl}/auth/setup-password?token=${token}`
      } catch (error) {
        console.warn('Could not generate password setup link:', error)
      }
    }

    res.status(200).json({ 
      message: 'Admin access granted successfully',
      user: adminEntry,
      passwordSetupLink
    })

  } catch (error) {
    console.error('Error granting admin access:', error)
    res.status(500).json({ 
      error: 'Failed to grant admin access',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}