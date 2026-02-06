import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type FileTab = 'html' | 'css' | 'js';

interface ContentData {
  id?: string;
  title: string;
  subject: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [activeTab, setActiveTab] = useState<FileTab>('html');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [content, setContent] = useState<ContentData>({
    title: '',
    subject: '',
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Start building your project here.</p>
</body>
</html>`,
    cssCode: `/* Add your styles here */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
}

h1 {
    margin-bottom: 10px;
}`,
    jsCode: `// Add your JavaScript here
console.log('Hello from JavaScript!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document is ready!');
});`,
  });

  // Load content if editing
  useEffect(() => {
    if (id) {
      fetch(`/api/contents/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setContent({
              id: data.id,
              title: data.title || '',
              subject: data.subject || '',
              htmlCode: data.htmlCode || '',
              cssCode: data.cssCode || '',
              jsCode: data.jsCode || '',
            });
          }
        })
        .catch(console.error);
    }
  }, [id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const getPreviewHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${content.cssCode}</style>
</head>
<body>
${content.htmlCode.replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '')}
<script>${content.jsCode}<\/script>
</body>
</html>`;
  };

  const handleSave = async (publish = false) => {
    if (!content.title || !content.subject) {
      alert('Please fill in title and subject');
      return;
    }

    setSaving(true);
    try {
      const url = id ? `/api/contents/${id}` : '/api/contents';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          isPublished: publish,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContent((prev) => ({ ...prev, id: data.id }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        if (publish) {
          setDeployed(true);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    await handleSave(true);
    setDeploying(false);
  };

  const getSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const fileIcons = {
    html: (
      <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 18.178l4.62-1.256.623-6.778H9.026L8.822 7.89h8.626l.227-2.211H6.325l.636 6.678h7.82l-.261 2.866-2.52.667-2.52-.667-.158-1.844H7.04l.327 3.614L12 18.178z"/>
      </svg>
    ),
    css: (
      <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 18.178l4.62-1.256.623-6.778H9.026L8.822 7.89h8.626l.227-2.211H6.325l.636 6.678h7.82l-.261 2.866-2.52.667-2.52-.667-.158-1.844H7.04l.327 3.614L12 18.178z"/>
      </svg>
    ),
    js: (
      <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.775-.507.775-.507 1.316-.844-.203-.314-.304-.451-.439-.586-.473-.528-1.103-.798-2.126-.775l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.608 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.528.056-1.237l.034.049z"/>
      </svg>
    ),
  };

  return (
    <>
      <Head>
        <title>{id ? 'Edit' : 'Create'} Project - Content Hub</title>
      </Head>

      <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved successfully!
          </div>
        )}

        {/* Top Bar */}
        <div className="h-12 bg-[#323233] border-b border-[#3c3c3c] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </Link>
            <div className="h-4 w-px bg-gray-600" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-sm font-medium">{content.title || 'Untitled Project'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                showPreview
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50'
                  : 'bg-[#3c3c3c] text-gray-300 hover:bg-[#4c4c4c]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>

            {/* Save Button */}
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={deploying || !content.title || !content.subject}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                deployed
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25'
              }`}
            >
              {deploying ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deploying...
                </>
              ) : deployed ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Deployed!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Deploy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Project Info */}
          <div className="w-72 bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
            {/* Project Details */}
            <div className="p-4 border-b border-[#3c3c3c]">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Project Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    className="w-full bg-[#3c3c3c] border border-[#4c4c4c] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Subject</label>
                  <input
                    type="text"
                    value={content.subject}
                    onChange={(e) => setContent({ ...content, subject: e.target.value })}
                    className="w-full bg-[#3c3c3c] border border-[#4c4c4c] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Web Development"
                  />
                </div>
              </div>
            </div>

            {/* File Explorer */}
            <div className="flex-1 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Files
              </h3>
              <div className="space-y-1">
                {(['html', 'css', 'js'] as FileTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      activeTab === tab
                        ? 'bg-[#37373d] text-white'
                        : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'
                    }`}
                  >
                    {fileIcons[tab]}
                    <span>
                      {tab === 'html' && 'index.html'}
                      {tab === 'css' && 'style.css'}
                      {tab === 'js' && 'script.js'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live URL */}
            {deployed && content.title && content.subject && (
              <div className="p-4 border-t border-[#3c3c3c]">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Live URL
                </h3>
                <a
                  href={`/${getSlug(content.subject)}/${getSlug(content.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 break-all"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  /{getSlug(content.subject)}/{getSlug(content.title)}
                </a>
              </div>
            )}
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Tab Bar */}
            <div className="h-10 bg-[#252526] flex items-center border-b border-[#3c3c3c]">
              {(['html', 'css', 'js'] as FileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-full flex items-center gap-2 px-4 text-sm border-r border-[#3c3c3c] transition-all ${
                    activeTab === tab
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-t-violet-500'
                      : 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {fileIcons[tab]}
                  <span>
                    {tab === 'html' && 'index.html'}
                    {tab === 'css' && 'style.css'}
                    {tab === 'js' && 'script.js'}
                  </span>
                  {activeTab === tab && (
                    <span className="w-2 h-2 rounded-full bg-violet-500 ml-1" />
                  )}
                </button>
              ))}
            </div>

            {/* Editor + Preview */}
            <div className="flex-1 flex">
              {/* Code Editor */}
              <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full`}>
                <MonacoEditor
                  height="100%"
                  language={activeTab === 'js' ? 'javascript' : activeTab}
                  theme="vs-dark"
                  value={
                    activeTab === 'html'
                      ? content.htmlCode
                      : activeTab === 'css'
                      ? content.cssCode
                      : content.jsCode
                  }
                  onChange={(value) => {
                    if (activeTab === 'html') {
                      setContent({ ...content, htmlCode: value || '' });
                    } else if (activeTab === 'css') {
                      setContent({ ...content, cssCode: value || '' });
                    } else {
                      setContent({ ...content, jsCode: value || '' });
                    }
                  }}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    renderLineHighlight: 'all',
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>

              {/* Preview Panel */}
              {showPreview && (
                <div className="w-1/2 border-l border-[#3c3c3c] flex flex-col">
                  <div className="h-10 bg-[#252526] flex items-center px-4 border-b border-[#3c3c3c]">
                    <span className="text-sm text-gray-400">Live Preview</span>
                  </div>
                  <div className="flex-1 bg-white">
                    <iframe
                      srcDoc={getPreviewHtml()}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-scripts"
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
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {deployed ? 'Published' : 'Draft'}
            </span>
            <span>{activeTab.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            <span>Spaces: 2</span>
            <span className="flex items-center gap-1">
              {session?.user?.name || 'Anonymous'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
