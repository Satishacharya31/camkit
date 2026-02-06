import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function Home() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>('All')

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

  const subjects = ['All', ...Array.from(new Set(contents.map(c => c.subject)))]
  const filteredContents = selectedSubject === 'All' 
    ? contents 
    : contents.filter(c => c.subject === selectedSubject)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Content Hub
              </h1>
              <p className="text-xl text-blue-200 max-w-2xl">
                Discover, learn, and explore educational content from our growing community
              </p>
            </div>
            <Link href="/admin/login" className="bg-white/10 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition border border-white/20 shadow-lg">
              🔐 Admin Login
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">{contents.length}</div>
              <div className="text-blue-200">Total Articles</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">{subjects.length - 1}</div>
              <div className="text-blue-200">Subjects</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">∞</div>
              <div className="text-blue-200">Knowledge</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-6 text-gray-300 text-lg">Loading amazing content...</p>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
            <div className="text-6xl mb-6">📚</div>
            <p className="text-gray-300 text-xl mb-4">No content available yet</p>
            <p className="text-gray-500">Be the first to create something amazing!</p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="bg-blue-500 w-1 h-8 rounded"></span>
                Browse by Subject
              </h2>
              
              <div className="flex flex-wrap gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      selectedSubject === subject
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {subject}
                    {subject !== 'All' && (
                      <span className="ml-2 text-xs opacity-75">
                        ({contents.filter(c => c.subject === subject).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6 text-gray-400">
              Showing <span className="text-white font-semibold">{filteredContents.length}</span> {filteredContents.length === 1 ? 'article' : 'articles'}
            </div>

            {/* Content Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredContents.map((content) => (
                <Link 
                  key={content.id} 
                  href={`/${content.subjectSlug}/${content.slug}`} 
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-2"
                >
                  <div className="p-6 h-full flex flex-col">
                    {/* Subject Badge */}
                    <div className="mb-4">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide">
                        {content.subject}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition line-clamp-2">
                      {content.title}
                    </h3>

                    {/* Date */}
                    <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(content.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>

                    {/* Preview */}
                    <div className="flex-1 mb-4 text-gray-400 text-sm bg-black/20 p-4 rounded-xl overflow-hidden max-h-20 line-clamp-3">
                      {content.htmlCode.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </div>

                    {/* Button */}
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition w-full flex items-center justify-center gap-2 shadow-lg">
                      Read Article
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2024 Content Hub. Empowering learners worldwide.</p>
        </div>
      </footer>
    </div>
  )
}
