import { Client } from 'pg'
import { prisma } from './prisma'

// Neon Authentication Configuration
export interface NeonAuthConfig {
  apiKey?: string
  projectId?: string
  branchId?: string
  databaseUrl: string
  enableDatabaseRoles?: boolean
  enableApiAuth?: boolean
}

// Neon User Interface
export interface NeonUser {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'USER'
  databaseRole?: string
  neonUserId?: string
  permissions?: string[]
  createdAt: Date
  updatedAt: Date
}

// Database Connection for Admin Operations
export class NeonDatabaseAuth {
  private adminClient: Client | null = null
  
  constructor(private config: NeonAuthConfig) {}

  async connect(): Promise<void> {
    if (this.adminClient) return
    
    this.adminClient = new Client({
      connectionString: this.config.databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
    
    await this.adminClient.connect()
  }

  async disconnect(): Promise<void> {
    if (this.adminClient) {
      await this.adminClient.end()
      this.adminClient = null
    }
  }

  // Check if a database user exists
  async checkDatabaseUser(email: string): Promise<boolean> {
    await this.connect()
    
    try {
      const result = await this.adminClient!.query(
        'SELECT 1 FROM pg_user WHERE usename = $1',
        [email.replace('@', '_').replace('.', '_')]
      )
      return result.rows.length > 0
    } catch (error) {
      console.warn('Error checking database user:', error)
      return false
    }
  }

  // Create database user with role
  async createDatabaseUser(email: string, role: 'admin' | 'user' = 'user'): Promise<boolean> {
    await this.connect()
    
    try {
      const username = email.replace('@', '_').replace('.', '_')
      const password = this.generateSecurePassword()
      
      // Create database user
      await this.adminClient!.query(
        `CREATE USER ${username} WITH PASSWORD '${password}'`
      )
      
      // Grant appropriate permissions
      if (role === 'admin') {
        await this.adminClient!.query(
          `GRANT CREATE, CONNECT ON DATABASE ${this.getDatabaseName()} TO ${username}`
        )
        await this.adminClient!.query(
          `GRANT USAGE, CREATE ON SCHEMA public TO ${username}`
        )
      } else {
        await this.adminClient!.query(
          `GRANT CONNECT ON DATABASE ${this.getDatabaseName()} TO ${username}`
        )
        await this.adminClient!.query(
          `GRANT USAGE ON SCHEMA public TO ${username}`
        )
      }
      
      return true
    } catch (error) {
      console.error('Error creating database user:', error)
      return false
    }
  }

  // Validate user credentials against database
  async validateDatabaseUser(email: string, password: string): Promise<boolean> {
    const username = email.replace('@', '_').replace('.', '_')
    
    try {
      const testClient = new Client({
        connectionString: this.config.databaseUrl.replace(/\/[^\/]+$/, `/${this.getDatabaseName()}`),
        user: username,
        password: password,
        ssl: { rejectUnauthorized: false }
      })
      
      await testClient.connect()
      await testClient.end()
      return true
    } catch (error) {
      return false
    }
  }

  private generateSecurePassword(): string {
    const crypto = require('crypto')
    return crypto.randomBytes(16).toString('hex')
  }

  private getDatabaseName(): string {
    const url = new URL(this.config.databaseUrl)
    return url.pathname.substring(1)
  }
}

// Neon API Authentication
export class NeonApiAuth {
  constructor(private config: NeonAuthConfig) {}

  // Get project information
  async getProjectInfo(): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Neon API key not configured')
    }

    try {
      const response = await fetch(`https://console.neon.tech/api/v2/projects/${this.config.projectId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Neon API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Neon API error:', error)
      throw error
    }
  }

  // List database users
  async listDatabaseUsers(): Promise<any[]> {
    if (!this.config.apiKey) return []

    try {
      const response = await fetch(
        `https://console.neon.tech/api/v2/projects/${this.config.projectId}/branches/${this.config.branchId}/roles`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) return []

      const data = await response.json()
      return data.roles || []
    } catch (error) {
      console.error('Error fetching Neon users:', error)
      return []
    }
  }

  // Create database role via API
  async createDatabaseRole(name: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Neon API key not configured')
    }

    try {
      const response = await fetch(
        `https://console.neon.tech/api/v2/projects/${this.config.projectId}/branches/${this.config.branchId}/roles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to create role: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating Neon role:', error)
      throw error
    }
  }
}

// Combined Neon Authentication Service
export class NeonAuthService {
  private dbAuth: NeonDatabaseAuth
  private apiAuth: NeonApiAuth

  constructor(config: NeonAuthConfig) {
    this.dbAuth = new NeonDatabaseAuth(config)
    this.apiAuth = new NeonApiAuth(config)
  }

  // Authenticate user with multiple methods
  async authenticateUser(email: string, password?: string): Promise<NeonUser | null> {
    try {
      // First, check in our application database
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          accounts: true
        }
      })

      if (!user) return null

      // If password provided, validate against database
      if (password && user.password) {
        const bcrypt = await import('bcryptjs')
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null
      }

      // Check admin whitelist
      const adminEntry = await prisma.adminWhitelist.findUnique({
        where: { email }
      })

      const isAdmin = user.role === 'ADMIN' && adminEntry?.isActive

      // Check database user exists
      const hasDbUser = await this.dbAuth.checkDatabaseUser(email)

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: isAdmin ? 'ADMIN' : 'USER',
        databaseRole: hasDbUser ? email.replace('@', '_').replace('.', '_') : undefined,
        permissions: isAdmin ? [
          ...(adminEntry?.canManageUsers ? ['manage_users'] : []),
          ...(adminEntry?.canManageContent ? ['manage_content'] : []),
          ...(adminEntry?.canManageSettings ? ['manage_settings'] : [])
        ] : ['read'],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  // Create comprehensive user
  async createUser(email: string, name?: string, role: 'ADMIN' | 'USER' = 'USER'): Promise<NeonUser | null> {
    try {
      // Create in application database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role
        }
      })

      // If admin, add to whitelist
      if (role === 'ADMIN') {
        await prisma.adminWhitelist.create({
          data: {
            email,
            name,
            isActive: true,
            canManageUsers: true,
            canManageContent: true,
            canManageSettings: false,
            notes: `Created via Neon auth on ${new Date().toISOString()}`
          }
        })
      }

      // Create database user
      const dbRole = role === 'ADMIN' ? 'admin' : 'user'
      await this.dbAuth.createDatabaseUser(email, dbRole)

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        databaseRole: email.replace('@', '_').replace('.', '_'),
        permissions: role === 'ADMIN' ? ['manage_users', 'manage_content'] : ['read'],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    } catch (error) {
      console.error('User creation error:', error)
      return null
    }
  }

  // Get project information
  async getProjectInfo() {
    return this.apiAuth.getProjectInfo()
  }

  // List all users with Neon information
  async listUsers(): Promise<NeonUser[]> {
    try {
      const users = await prisma.user.findMany({
        include: {
          accounts: true
        }
      })

      const neonUsers: NeonUser[] = []

      for (const user of users) {
        const adminEntry = await prisma.adminWhitelist.findUnique({
          where: { email: user.email! }
        })

        const isAdmin = user.role === 'ADMIN' && adminEntry?.isActive
        const hasDbUser = await this.dbAuth.checkDatabaseUser(user.email!)

        neonUsers.push({
          id: user.id,
          email: user.email!,
          name: user.name,
          role: isAdmin ? 'ADMIN' : 'USER',
          databaseRole: hasDbUser ? user.email!.replace('@', '_').replace('.', '_') : undefined,
          permissions: isAdmin ? [
            ...(adminEntry?.canManageUsers ? ['manage_users'] : []),
            ...(adminEntry?.canManageContent ? ['manage_content'] : []),
            ...(adminEntry?.canManageSettings ? ['manage_settings'] : [])
          ] : ['read'],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })
      }

      return neonUsers
    } catch (error) {
      console.error('Error listing users:', error)
      return []
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    await this.dbAuth.disconnect()
  }
}

// Configuration helper
export function createNeonAuthConfig(): NeonAuthConfig {
  return {
    apiKey: process.env.NEON_API_KEY,
    projectId: process.env.NEON_PROJECT_ID,
    branchId: process.env.NEON_BRANCH_ID || 'main',
    databaseUrl: process.env.DATABASE_URL || '',
    enableDatabaseRoles: process.env.NEON_ENABLE_DB_ROLES === 'true',
    enableApiAuth: process.env.NEON_ENABLE_API_AUTH === 'true'
  }
}

// Singleton instance
let neonAuthService: NeonAuthService | null = null

export function getNeonAuthService(): NeonAuthService {
  if (!neonAuthService) {
    neonAuthService = new NeonAuthService(createNeonAuthConfig())
  }
  return neonAuthService
}

export async function cleanupNeonAuth(): Promise<void> {
  if (neonAuthService) {
    await neonAuthService.disconnect()
    neonAuthService = null
  }
}