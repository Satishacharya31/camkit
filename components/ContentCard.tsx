import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface ContentCardProps {
    id: string;
    title: string;
    subject: string;
    subjectSlug: string;
    slug: string;
    htmlCode?: string;
    cssCode?: string;
    jsCode?: string;
    type?: 'CODE' | 'PDF' | 'DOCUMENT' | 'IMAGE';
    thumbnail?: string;
    createdAt: string;
}

const subjectColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    'Physics': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-blue-600/20' },
    'Chemistry': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', gradient: 'from-teal-500/20 to-emerald-600/20' },
    'Biology': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', gradient: 'from-green-500/20 to-lime-600/20' },
    'Computer Science': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-red-600/20' },
    'Mathematics': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', gradient: 'from-blue-500/20 to-indigo-600/20' },
};

export default function ContentCard({
    id,
    title,
    subject,
    subjectSlug,
    slug,
    htmlCode,
    cssCode,
    jsCode,
    type = 'CODE',
    thumbnail,
    createdAt,
}: ContentCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const colors = subjectColors[subject] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', gradient: 'from-slate-500/20 to-gray-600/20' };

    // Construct preview HTML safely
    const previewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; overflow: hidden; background: white; }
          ${cssCode || ''}
          /* Scale down content to fit preview */
          body { transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%; }
        </style>
      </head>
      <body>
        ${htmlCode || ''}
        <script>
          // Disable interactions
          document.addEventListener('click', e => e.preventDefault(), true);
          document.addEventListener('submit', e => e.preventDefault(), true);
          ${jsCode || ''}
        </script>
      </body>
    </html>
  `;

    return (
        <Link
            href={`/${subjectSlug}/${slug}`}
            className="group relative block h-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Card Container */}
            <div className="absolute inset-0 bg-white dark:bg-[#12121a]/80 backdrop-blur-md border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300 group-hover:border-blue-500/30 dark:group-hover:border-white/20 group-hover:transform group-hover:-translate-y-1 group-hover:shadow-2xl dark:shadow-none shadow-blue-500/10">

                {/* Preview Area */}
                <div className={`h-40 w-full relative bg-gradient-to-br ${colors.gradient} border-b border-gray-100 dark:border-white/5 overflow-hidden`}>

                    {type === 'CODE' && (
                        // Code Preview (Iframe)
                        <div className="w-full h-full relative">
                            {/* Overlay to prevent interaction with iframe */}
                            <div className="absolute inset-0 z-10 bg-transparent" />
                            <iframe
                                ref={iframeRef}
                                srcDoc={previewHtml}
                                className="w-full h-full border-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                title={`${title} Preview`}
                                loading="lazy"
                                sandbox="allow-scripts"
                                tabIndex={-1}
                            />
                        </div>
                    )}

                    {type === 'PDF' && (
                        // PDF Icon / Thumbnail
                        <div className="w-full h-full flex items-center justify-center relative">
                            {thumbnail ? (
                                <Image
                                    src={thumbnail}
                                    alt={title}
                                    fill
                                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : (
                                <svg className={`w-16 h-16 ${colors.text} opacity-50`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                </svg>
                            )}
                        </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-3 right-3 z-20">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border} shadow-sm`}>
                            {type}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 relative">
                    {/* Glow Effect */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${colors.bg}`} />

                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${colors.bg.replace('/10', '')}`} />
                        <span className={`text-xs font-medium ${colors.text}`}>{subject}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>

                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                            <span className="text-xs text-blue-600 dark:text-white/50 dark:group-hover:text-white transition-colors">View</span>
                            <svg className="w-4 h-4 text-blue-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>
                </div>

            </div>
        </Link>
    );
}
