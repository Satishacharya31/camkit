import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Content {
  id: string
  title: string
  subject: string
  htmlCode: string
  cssCode: string
  jsCode: string
  createdAt: string
  updatedAt: string
  slug: string
  subjectSlug: string
}

type FileType = 'html' | 'css' | 'js'

const fileIcons: Record<FileType, string> = {
  html: '📄',
  css: '🎨',
  js: '⚡',
}

const fileColors: Record<FileType, string> = {
  html: '#e34c26',
  css: '#264de4',
  js: '#f7df1e',
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Project state
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>Start writing your content here...</p>\n</body>\n</html>')
  const [cssCode, setCssCode] = useState('/* Your styles here */\n\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: #ffffff;\n  color: #333;\n}\n\nh1 {\n  color: #2563eb;\n}\n')
  const [jsCode, setJsCode] = useState('// Your JavaScript here\n\nconsole.log("Page loaded!");\n')
  
  // UI state
  const [activeFile, setActiveFile] = useState<FileType>('html')
  const [showPreview, setShowPreview] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [contents, setContents] = useState<Content[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  
  // Check auth
  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session?.user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const user = session.user as any
    if (!user.isAdmin) {
      router.push('/login')
      return
    }

    fetchContents()
  }, [session, status, router])

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/contents')
      const data = await response.json()
      setContents(data)
    } catch (error) {
      console.error('Error fetching contents:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !subject.trim()) {
      alert('Please enter a title and subject')
      return
    }

    setIsSaving(true)

    try {
      const url = editingId ? `/api/contents/${editingId}` : '/api/contents'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          title,
          subject,
          htmlCode,
          cssCode,
          jsCode,
        }),
      })

      if (response.ok) {
        fetchContents()
        if (!editingId) {
          resetEditor()
        }
        alert(editingId ? 'Content updated!' : 'Content created!')
      } else {
        alert('Error saving content')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving content')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const response = await fetch(`/api/contents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      })

      if (response.ok) {
        fetchContents()
        if (editingId === id) {
          resetEditor()
        }
        alert('Content deleted!')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (content: Content) => {
    setEditingId(content.id)
    setTitle(content.title)
    setSubject(content.subject)
    setHtmlCode(content.htmlCode || '')
    setCssCode(content.cssCode || '')
    setJsCode(content.jsCode || '')
    setActiveFile('html')
  }

  const resetEditor = () => {
    setEditingId(null)
    setTitle('')
    setSubject('')
    setHtmlCode('<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>Start writing your content here...</p>\n</body>\n</html>')
    setCssCode('/* Your styles here */\n\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: #ffffff;\n  color: #333;\n}\n\nh1 {\n  color: #2563eb;\n}\n')
    setJsCode('// Your JavaScript here\n\nconsole.log("Page loaded!");\n')
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const getEditorValue = useCallback(() => {
    switch (activeFile) {
      case 'html': return htmlCode
      case 'css': return cssCode
      case 'js': return jsCode
    }
  }, [activeFile, htmlCode, cssCode, jsCode])

  const handleEditorChange = (value: string | undefined) => {
    const val = value || ''
    switch (activeFile) {
      case 'html': setHtmlCode(val); break
      case 'css': setCssCode(val); break
      case 'js': setJsCode(val); break
    }
  }

  const getLanguage = () => {
    switch (activeFile) {
      case 'html': return 'html'
      case 'css': return 'css'
      case 'js': return 'javascript'
    }
  }

  const generatePreview = () => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssCode}</style>
</head>
<body>
${htmlCode.replace(/<!DOCTYPE html>|<\/?html>|<\/?head>|<\/?body>|<meta[^>]*>|<title>[^<]*<\/title>/gi, '')}
<script>${jsCode}</script>
</body>
</html>`
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-xl font-medium">Loading Dashboard...</span>
        </div>
      </div>
    )
  }

  if (!session?.user || !(session.user as any).isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-lg font-semibold">Access Denied</span>
          </div>
          <p className="mt-2">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden">
      {/* Modern Header */}
      <div className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">Content Hub Pro</h1>
              <p className="text-sm text-blue-300">Admin Dashboard</p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-gray-300">{editingId ? `Editing: ${title || 'Untitled'}` : 'New Project'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
            <img 
              src={(session.user as any)?.image || '/default-avatar.png'} 
              alt="Profile" 
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-white">{(session.user as any)?.name || (session.user as any)?.email}</span>
          </div>
          <button
            onClick={() => router.push('/neon/dashboard')}
            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors flex items-center gap-2 text-sm text-green-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
            </svg>
            Neon DB
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors flex items-center gap-2 text-sm text-red-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-2 gap-2 border-r border-[#1e1e1e]">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#505050] transition ${showSidebar ? 'text-white bg-[#505050]' : 'text-gray-500'}`}
            title="Explorer"
          >
            📁
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#505050] transition ${showPreview ? 'text-white bg-[#505050]' : 'text-gray-500'}`}
            title="Preview"
          >
            👁️
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-10 h-10 flex items-center justify-center rounded bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            💾
          </button>
        </div>

        {/* Sidebar - File Explorer */}
        {showSidebar && (
          <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col overflow-hidden">
            {/* Project Info */}
            <div className="p-3 border-b border-[#1e1e1e]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">PROJECT</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project Title"
                className="w-full bg-[#3c3c3c] text-white text-sm px-2 py-1 rounded border border-[#3c3c3c] focus:border-blue-500 focus:outline-none mb-2"
              />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject / Category"
                className="w-full bg-[#3c3c3c] text-white text-sm px-2 py-1 rounded border border-[#3c3c3c] focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Files */}
            <div className="p-3 border-b border-[#1e1e1e]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">FILES</div>
              {(['html', 'css', 'js'] as FileType[]).map((file) => (
                <div
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                    activeFile === file ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2a2a]'
                  }`}
                >
                  <span>{fileIcons[file]}</span>
                  <span style={{ color: activeFile === file ? fileColors[file] : undefined }}>
                    content.{file}
                  </span>
                </div>
              ))}
            </div>

            {/* Saved Contents */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">SAVED ({contents.length})</span>
                <button
                  onClick={resetEditor}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  + New
                </button>
              </div>
              <div className="space-y-1">
                {contents.map((content) => (
                  <div
                    key={content.id}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer ${
                      editingId === content.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleEdit(content)}
                  >
                    <div className="truncate flex-1">
                      <div className="truncate">{content.title}</div>
                      <div className="text-xs text-gray-500">{content.subject}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(content.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-9 bg-[#252526] flex items-center border-b border-[#1e1e1e]">
            {(['html', 'css', 'js'] as FileType[]).map((file) => (
              <div
                key={file}
                onClick={() => setActiveFile(file)}
                className={`h-full flex items-center gap-2 px-4 cursor-pointer text-sm border-r border-[#1e1e1e] ${
                  activeFile === file
                    ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500'
                    : 'text-gray-400 hover:bg-[#2a2a2a]'
                }`}
              >
                <span>{fileIcons[file]}</span>
                <span>content.{file}</span>
              </div>
            ))}
          </div>

          {/* Editor + Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Monaco Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full`}>
              <MonacoEditor
                height="100%"
                language={getLanguage()}
                theme="vs-dark"
                value={getEditorValue()}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                  bracketPairColorization: { enabled: true },
                  suggest: { snippetsPreventQuickSuggestions: false },
                  quickSuggestions: true,
                  padding: { top: 10, bottom: 10 },
                  folding: true,
                  foldingHighlight: true,
                  showFoldingControls: 'always',
                  matchBrackets: 'always',
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  autoIndent: 'full',
                  colorDecorators: true,
                }}
              />
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-1/2 flex flex-col border-l border-[#1e1e1e]">
                <div className="h-8 bg-[#252526] flex items-center px-4 text-xs text-gray-400 border-b border-[#1e1e1e]">
                  <span>👁️ Live Preview</span>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    srcDoc={generatePreview()}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white">
        <div className="flex items-center gap-4">
          <span>⚡ Ready</span>
          <span>|</span>
          <span>{activeFile.toUpperCase()}</span>
          <span>|</span>
          <span>
            {activeFile === 'html' && `${htmlCode.split('\n').length} lines`}
            {activeFile === 'css' && `${cssCode.split('\n').length} lines`}
            {activeFile === 'js' && `${jsCode.split('\n').length} lines`}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>|</span>
          <span>{isSaving ? 'Saving...' : editingId ? 'Editing' : 'New'}</span>
        </div>
      </div>
    </div>
  )
}
