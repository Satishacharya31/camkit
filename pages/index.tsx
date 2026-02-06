import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useSession } from 'next-auth/react'

interface Content {
  id: string
  title: string
  subject: string
  htmlCode: string
  cssCode: string
  jsCode: string
  createdAt: string
  slug: string
  subjectSlug: string
}

const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
  'Physics': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Chemistry': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'Biology': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  'Computer Science': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  'Mathematics': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
}

const getSubjectColor = (subject: string) => {
  return subjectColors[subject] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
}

export default function Home() {
  const { data: session } = useSession()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/contents')
      const data = await response.json()
      setContents(data)
    } catch (error) {
      console.error('Error fetching contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const subjects: string[] = ['All', ...Array.from(new Set<string>(contents.map(c => c.subject)))]
  const filteredContents = contents.filter(c => {
    const matchesSubject = selectedSubject === 'All' || c.subject === selectedSubject
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSubject && matchesSearch
  })

  return (
    <>
      <Head>
        <title>LabCMS - Dashboard</title>
        <meta name="description" content="Manage your lab reports and experiments" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0f0f15] border-r border-white/5 flex flex-col z-50">
          {/* Logo */}
          <div className="h-12 flex items-center px-4 border-b border-white/5">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-2">
              <span className="text-xs font-bold">L</span>
            </div>
            <span className="font-semibold text-sm">LabCMS</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-2 space-y-0.5">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 text-white text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>
            <Link href="/upload" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              New Report
            </Link>
            <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            {(session?.user as any)?.isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
            )}
          </nav>

          {/* User */}
          <div className="p-3 border-t border-white/5">
            {session?.user ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-medium">
                  {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{session.user.name || 'User'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{session.user.email}</p>
                </div>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-56">
          {/* Header */}
          <header className="sticky top-0 z-40 h-12 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-medium">All Reports</h1>
              <span className="text-xs text-gray-500">({filteredContents.length})</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-md px-2 py-1 w-52">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-gray-500 w-full ml-2 focus:outline-none"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* New Button */}
              <Link href="/upload" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </Link>
            </div>
          </header>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto">
            {subjects.map((subject) => {
              const colors = getSubjectColor(subject)
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${selectedSubject === subject
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {subject}
                </button>
              )
            })}
          </div>

          {/* Hero Section */}
          <div className="px-4 py-6 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  {session?.user?.name ? `Welcome back, ${session.user.name.split(' ')[0]}` : 'Welcome to LabCMS'}
                </h2>
                <p className="text-sm text-gray-400">
                  {contents.length > 0
                    ? `You have ${contents.length} report${contents.length !== 1 ? 's' : ''} in your workspace`
                    : 'Create and manage your lab reports in one place'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{contents.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Reports</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{subjects.length - 1}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Subjects</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : filteredContents.length === 0 ? (
              <div className="py-16">
                {/* Empty State */}
                <div className="max-w-md mx-auto text-center">
                  {/* Illustration */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                      <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    {searchQuery ? 'No matching reports' : 'No reports yet'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    {searchQuery
                      ? `No reports found for "${searchQuery}". Try a different search term.`
                      : 'Get started by creating your first lab report. It only takes a minute.'}
                  </p>

                  {/* Action Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/upload"
                      className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-0.5">Create New</h4>
                      <p className="text-xs text-blue-200">Start from scratch</p>
                    </Link>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-left">
                      <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-0.5">Import</h4>
                      <p className="text-xs text-gray-500">Coming soon</p>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Quick Tips</p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Write HTML, CSS, and JavaScript in the editor</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Preview your report in real-time</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Publish when ready to share</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {filteredContents.map((content) => {
                  const colors = getSubjectColor(content.subject)
                  return (
                    <Link
                      key={content.id}
                      href={`/${content.subjectSlug}/${content.slug}`}
                      className="group bg-[#12121a] border border-white/5 rounded-lg overflow-hidden hover:border-white/10 transition-colors"
                    >
                      <div className="aspect-video bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-md ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${colors.text}`}>{content.subject[0]}</span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                          {content.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[10px] ${colors.text}`}>{content.subject}</span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(content.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredContents.map((content) => {
                  const colors = getSubjectColor(content.subject)
                  return (
                    <Link
                      key={content.id}
                      href={`/${content.subjectSlug}/${content.slug}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors group"
                    >
                      <div className={`w-6 h-6 rounded ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-[10px] font-bold ${colors.text}`}>{content.subject[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                          {content.title}
                        </h3>
                      </div>
                      <span className={`text-[10px] ${colors.text} px-2 py-0.5 rounded ${colors.bg}`}>{content.subject}</span>
                      <span className="text-[10px] text-gray-500 w-16 text-right">
                        {new Date(content.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
