import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'

interface User {
    id: string
    name: string | null
    email: string | null
    role: string
    createdAt: string
    _count?: { contents: number }
}

interface ContentWithUser {
    id: string
    title: string
    subject: string
    slug: string
    subjectSlug: string
    views: number
    isPublished: boolean
    createdAt: string
    user: {
        id: string
        name: string | null
        email: string | null
    }
}

interface Stats {
    totalUsers: number
    totalContents: number
    totalViews: number
    publishedCount: number
}

export default function AdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState<'users' | 'contents'>('users')
    const [users, setUsers] = useState<User[]>([])
    const [contents, setContents] = useState<ContentWithUser[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (status === 'loading') return
        if (!session?.user) {
            router.push('/login')
            return
        }
        if (!(session.user as any).isAdmin) {
            router.push('/')
            return
        }
        fetchData()
    }, [session, status, router])

    const fetchData = async () => {
        try {
            const [usersRes, contentsRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/contents')
            ])

            const usersData = await usersRes.json()
            const contentsData = await contentsRes.json()

            setUsers(usersData.users || [])
            setContents(contentsData.contents || [])

            // Calculate stats
            const totalViews = (contentsData.contents || []).reduce((sum: number, c: ContentWithUser) => sum + (c.views || 0), 0)
            const publishedCount = (contentsData.contents || []).filter((c: ContentWithUser) => c.isPublished).length

            setStats({
                totalUsers: usersData.users?.length || 0,
                totalContents: contentsData.contents?.length || 0,
                totalViews,
                publishedCount
            })
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteContent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return

        try {
            const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredContents = contents.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!session?.user || !(session.user as any).isAdmin) {
        return (
            <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
                    Access Denied - Admin privileges required
                </div>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>Admin Panel - LabCMS</title>
            </Head>

            <div className="min-h-screen bg-[#0f1117] text-white">
                {/* Header */}
                <header className="bg-[#1a1d27] border-b border-gray-800 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="font-semibold">LabCMS</span>
                            </Link>
                            <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded">Admin</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                                ← Back to Home
                            </Link>
                            <div className="w-px h-4 bg-gray-700" />
                            <span className="text-sm text-gray-400">{session.user?.email}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'Users', value: stats.totalUsers, icon: '👥', color: 'violet' },
                                { label: 'Content', value: stats.totalContents, icon: '📄', color: 'blue' },
                                { label: 'Views', value: stats.totalViews, icon: '👁️', color: 'cyan' },
                                { label: 'Published', value: stats.publishedCount, icon: '🚀', color: 'green' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#1a1d27] border border-gray-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-lg">{stat.icon}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="flex gap-1 bg-[#1a1d27] p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 text-sm rounded-md transition-all ${activeTab === 'users'
                                        ? 'bg-violet-500 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Users ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('contents')}
                                className={`px-4 py-2 text-sm rounded-md transition-all ${activeTab === 'contents'
                                        ? 'bg-violet-500 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Content ({contents.length})
                            </button>
                        </div>

                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:max-w-xs bg-[#1a1d27] border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                            />
                        </div>
                    </div>

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-[#1a1d27] border border-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900/50">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Content</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-medium">
                                                                {user.name?.[0] || user.email?.[0] || 'U'}
                                                            </div>
                                                            <span className="font-medium">{user.name || 'Unnamed'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400">{user.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${user.role === 'ADMIN'
                                                                ? 'bg-violet-500/20 text-violet-400'
                                                                : 'bg-gray-700 text-gray-300'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400">
                                                        {user._count?.contents || 0} items
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Contents Tab */}
                    {activeTab === 'contents' && (
                        <div className="bg-[#1a1d27] border border-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900/50">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Owner</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Views</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filteredContents.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                    No content found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredContents.map((content) => (
                                                <tr key={content.id} className="hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium">{content.title}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                                            {content.subject}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400">
                                                        {content.user.name || content.user.email || 'Unknown'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400">{content.views || 0}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${content.isPublished
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : 'bg-amber-500/20 text-amber-400'
                                                            }`}>
                                                            {content.isPublished ? 'Published' : 'Draft'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/upload?id=${content.id}`}
                                                                className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-xs transition-colors"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <a
                                                                href={`/${content.subjectSlug}/${content.slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded text-xs transition-colors"
                                                            >
                                                                View
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteContent(content.id)}
                                                                className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
