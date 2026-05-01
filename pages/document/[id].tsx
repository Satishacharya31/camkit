import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import prisma from '../../lib/prisma';

interface DocumentViewerProps {
    document: {
        id: string;
        title: string;
        subject: string;
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        views: number;
        createdAt: string;
        author: string;
    } | null;
}

export default function DocumentViewer({ document }: DocumentViewerProps) {
    const router = useRouter();
    const [backButtonPos, setBackButtonPos] = useState({ x: 16, y: 16 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStateRef = useRef({
        moved: false,
        suppressClick: false,
        offsetX: 0,
        offsetY: 0,
    });

    const clampPosition = (x: number, y: number) => {
        if (typeof window === 'undefined') {
            return { x, y };
        }
        const buttonWidth = 120;
        const buttonHeight = 44;
        const margin = 8;
        return {
            x: Math.min(Math.max(x, margin), window.innerWidth - buttonWidth - margin),
            y: Math.min(Math.max(y, margin), window.innerHeight - buttonHeight - margin),
        };
    };

    const handleBackMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        dragStateRef.current.moved = false;
        dragStateRef.current.offsetX = event.clientX - backButtonPos.x;
        dragStateRef.current.offsetY = event.clientY - backButtonPos.y;
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            const rawX = event.clientX - dragStateRef.current.offsetX;
            const rawY = event.clientY - dragStateRef.current.offsetY;
            const next = clampPosition(rawX, rawY);

            setBackButtonPos((current) => {
                if (Math.abs(next.x - current.x) > 2 || Math.abs(next.y - current.y) > 2) {
                    dragStateRef.current.moved = true;
                }
                return next;
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (dragStateRef.current.moved) {
                dragStateRef.current.suppressClick = true;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleBackButtonClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
        if (dragStateRef.current.suppressClick) {
            dragStateRef.current.suppressClick = false;
            event.preventDefault();
            return;
        }

        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        router.push('/');
    };

    useEffect(() => {
        const handleResize = () => {
            setBackButtonPos((current) => clampPosition(current.x, current.y));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!document) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white">
                <Head>
                    <title>Document Not Found | Campus Kit</title>
                </Head>
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
                    <p className="text-gray-400 mb-6">The document you're looking for doesn't exist or has been removed.</p>
                    <Link href="/" className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isPDF = document.mimeType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf') || document.fileUrl.toLowerCase().includes('.pdf');
    const pdfViewerUrl = `${document.fileUrl}#page=1&zoom=150&navpanes=0&toolbar=0`;
    const isWord = document.mimeType === 'application/msword' || document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || document.fileName.toLowerCase().endsWith('.doc') || document.fileName.toLowerCase().endsWith('.docx') || document.fileUrl.toLowerCase().includes('.doc') || document.fileUrl.toLowerCase().includes('.docx');
    const isPowerPoint = document.mimeType === 'application/vnd.ms-powerpoint' || document.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || document.fileName.toLowerCase().endsWith('.ppt') || document.fileName.toLowerCase().endsWith('.pptx') || document.fileUrl.toLowerCase().includes('.ppt') || document.fileUrl.toLowerCase().includes('.pptx');
    const isOfficeDocument = isWord || isPowerPoint;
    
    // Use Google Docs Viewer for all office documents (Word, PowerPoint) to preserve image quality
    const previewUrl = isOfficeDocument
            ? `https://docs.google.com/gview?url=${encodeURIComponent(document.fileUrl)}&embedded=true`
            : document.fileUrl;

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
            <Head>
                <title>{document.title} | Campus Kit</title>
                <meta name="description" content={`View ${document.title} in ${document.subject} on Campus Kit.`} />
                <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
                <link rel="canonical" href={`https://campuskit.vercel.app/document/${document.id}`} />
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="Campus Kit" />
                <meta property="og:url" content={`https://campuskit.vercel.app/document/${document.id}`} />
                <meta property="og:title" content={`${document.title} | Campus Kit`} />
                <meta property="og:description" content={`View ${document.title} in ${document.subject} on Campus Kit.`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${document.title} | Campus Kit`} />
                <meta name="twitter:description" content={`View ${document.title} in ${document.subject} on Campus Kit.`} />
            </Head>

            <div
                className="fixed z-[9999]"
                style={{ left: backButtonPos.x, top: backButtonPos.y, touchAction: 'none' }}
            >
                <button
                    type="button"
                    onMouseDown={handleBackMouseDown}
                    onClick={handleBackButtonClick}
                    className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm hover:bg-black/90 transition-colors shadow-lg cursor-move"
                    aria-label="Go back"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
            </div>

            {/* Document Viewer */}
            <main style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0, zIndex: 1 }}>
                {isPDF ? (
                    <div className="w-full h-full bg-[#111118]">
                        <object
                            data={pdfViewerUrl}
                            type="application/pdf"
                            className="w-full h-full border-none m-0 p-0 block"
                            aria-label={document.title}
                        >
                            <iframe
                                src={pdfViewerUrl}
                                className="w-full h-full border-none m-0 p-0 block"
                                title={document.title}
                            />
                        </object>
                    </div>
                ) : isOfficeDocument ? (
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-none m-0 p-0 block"
                        title={document.title}
                    />
                ) : document.mimeType.startsWith('image/') ? (
                    <div className="w-full h-full flex items-center justify-center p-8 bg-gray-900 border-none m-0 block">
                        <img
                            src={document.fileUrl}
                            alt={document.title}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Preview not available</h2>
                        <p className="text-gray-400 mb-6">This file type ({document.mimeType}) cannot be previewed in browser.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const id = params?.id as string;

    if (!id) {
        return { props: { document: null } };
    }

    try {
        const doc = await prisma.content.findFirst({
            where: {
                id,
                type: { in: ['PDF', 'DOCUMENT', 'IMAGE'] },
                isPublished: true,
            },
            select: {
                id: true,
                title: true,
                subject: true,
                fileUrl: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                views: true,
                createdAt: true,
                user: {
                    select: { name: true },
                },
            },
        });

        if (!doc || !doc.fileUrl) {
            return { props: { document: null } };
        }

        // Increment view count
        await prisma.content.update({
            where: { id: doc.id },
            data: { views: { increment: 1 } },
        });

        return {
            props: {
                document: {
                    id: doc.id,
                    title: doc.title,
                    subject: doc.subject,
                    fileUrl: doc.fileUrl,
                    fileName: doc.fileName || 'document',
                    fileSize: doc.fileSize || 0,
                    mimeType: doc.mimeType || 'application/octet-stream',
                    views: doc.views + 1,
                    createdAt: doc.createdAt.toISOString(),
                    author: doc.user?.name || 'Unknown',
                },
            },
        };
    } catch (error) {
        console.error('Error fetching document:', error);
        return { props: { document: null } };
    }
};
