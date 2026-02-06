import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

interface NeonUser {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'USER'
  databaseRole?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

interface ProjectInfo {
  id?: string
  name?: string
  region?: string
  created_at?: string
}

interface NeonStatus {
  neonAuthEnabled: boolean
  databaseStatus: string
  configuration: {
    hasApiKey: boolean
    hasProjectId: boolean
    hasBranchId: boolean
    hasDatabaseUrl: boolean
    enableDatabaseRoles: boolean
    enableApiAuth: boolean
  }
  project?: ProjectInfo
  features: {
    googleAuth: boolean
    credentialsAuth: boolean
    databaseRoles: boolean
    neonApiAuth: boolean
  }
}

export default function NeonDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<NeonUser[]>([])
  const [neonStatus, setNeonStatus] = useState<NeonStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'USER' as 'USER' | 'ADMIN'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user || !(session.user as any).isAdmin) {
      router.push('/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Neon status
      const statusResponse = await fetch('/api/neon/status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setNeonStatus(statusData)
      }

      // Fetch users
      const usersResponse = await fetch('/api/neon/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to load Neon data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email) return

    setCreating(true)
    try {
      const response = await fetch('/api/neon/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setNewUser({ email: '', name: '', role: 'USER' })
        setShowCreateForm(false)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create user')
      }
    } catch (err) {
      setError('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-xl font-medium">Loading Neon Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Neon Database Dashboard - Content Hub</title>
        <meta name="description" content="Manage Neon database users and authentication" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Neon Database Dashboard</h1>
                    <p className="text-sm text-gray-300">Manage database users and authentication</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Admin</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-300 hover:text-red-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Neon Status */}
          {neonStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${neonStatus.databaseStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span>Database Status</span>
                </h3>
                <p className="text-gray-300 capitalize">{neonStatus.databaseStatus}</p>
                {neonStatus.project && (
                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    <p><span className="font-medium">Project:</span> {neonStatus.project.name || neonStatus.project.id}</p>
                    <p><span className="font-medium">Region:</span> {neonStatus.project.region || 'Unknown'}</p>
                  </div>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>API Key</span>
                    <div className={`w-2 h-2 rounded-full ${neonStatus.configuration.hasApiKey ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database URL</span>
                    <div className={`w-2 h-2 rounded-full ${neonStatus.configuration.hasDatabaseUrl ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DB Roles</span>
                    <div className={`w-2 h-2 rounded-full ${neonStatus.configuration.enableDatabaseRoles ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Users</h3>
                <div className="text-3xl font-bold text-blue-400">{users.length}</div>
                <p className="text-gray-300 text-sm">Total database users</p>
                <div className="mt-4">
                  <div className="text-sm text-gray-400">
                    Admins: {users.filter(u => u.role === 'ADMIN').length} | 
                    Users: {users.filter(u => u.role === 'USER').length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Management */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Database Users</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create User</span>
                </button>
              </div>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
              <div className="p-6 border-b border-white/10 bg-white/5">
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Create New User</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'USER' | 'ADMIN' })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={creating || !newUser.email}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Create User</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Database Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{user.name || 'No name'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'ADMIN' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300 font-mono">
                          {user.databaseRole || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.permissions?.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                  <p>Create your first database user to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}