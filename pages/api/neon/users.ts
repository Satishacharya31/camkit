import { NextApiRequest, NextApiResponse } from 'next'
import { getNeonAuthService } from '@/lib/neon-auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const neonAuth = getNeonAuthService()

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetUsers(req, res, neonAuth)
      case 'POST':
        return await handleCreateUser(req, res, neonAuth)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Neon users API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await neonAuth.disconnect()
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse, neonAuth: any) {
  try {
    const users = await neonAuth.listUsers()
    const projectInfo = await neonAuth.getProjectInfo().catch(() => null)

    return res.status(200).json({
      users,
      projectInfo: projectInfo ? {
        id: projectInfo.project?.id,
        name: projectInfo.project?.name,
        region: projectInfo.project?.region_id,
        created_at: projectInfo.project?.created_at
      } : null,
      total: users.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return res.status(500).json({
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse, neonAuth: any) {
  const { email, name, role = 'USER' } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  if (role && !['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN' })
  }

  try {
    const user = await neonAuth.createUser(email, name, role)

    if (!user) {
      return res.status(400).json({ error: 'Failed to create user' })
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        databaseRole: user.databaseRole,
        permissions: user.permissions,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(500).json({
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}