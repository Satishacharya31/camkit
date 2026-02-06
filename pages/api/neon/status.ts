import { NextApiRequest, NextApiResponse } from 'next'
import { getNeonAuthService } from '@/lib/neon-auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const neonAuth = getNeonAuthService()

  try {
    // Get project information
    const projectInfo = await neonAuth.getProjectInfo().catch((error) => {
      console.warn('Could not fetch project info:', error.message)
      return null
    })

    // Test database connection
    let databaseStatus = 'unknown'
    try {
      const testUser = await neonAuth.authenticateUser('test@example.com')
      databaseStatus = 'connected'
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        databaseStatus = 'connected'
      } else {
        databaseStatus = 'error'
      }
    }

    // Get configuration status
    const config = {
      hasApiKey: !!process.env.NEON_API_KEY,
      hasProjectId: !!process.env.NEON_PROJECT_ID,
      hasBranchId: !!process.env.NEON_BRANCH_ID,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      enableDatabaseRoles: process.env.NEON_ENABLE_DB_ROLES === 'true',
      enableApiAuth: process.env.NEON_ENABLE_API_AUTH === 'true'
    }

    const status = {
      neonAuthEnabled: true,
      databaseStatus,
      configuration: config,
      project: projectInfo ? {
        id: projectInfo.project?.id,
        name: projectInfo.project?.name,
        region: projectInfo.project?.region_id,
        platform_version: projectInfo.project?.platform_version,
        provisioner: projectInfo.project?.provisioner,
        created_at: projectInfo.project?.created_at
      } : null,
      features: {
        googleAuth: !!process.env.GOOGLE_CLIENT_ID,
        credentialsAuth: true,
        databaseRoles: config.enableDatabaseRoles,
        neonApiAuth: config.enableApiAuth && config.hasApiKey
      }
    }

    return res.status(200).json(status)

  } catch (error) {
    console.error('Error getting Neon status:', error)
    return res.status(500).json({
      error: 'Failed to get Neon status',
      details: error instanceof Error ? error.message : 'Unknown error',
      neonAuthEnabled: false
    })
  } finally {
    await neonAuth.disconnect()
  }
}