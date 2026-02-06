import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadBase64, deleteByUrl, getMimeType } from '@/lib/azure-storage';

// Configure for larger file uploads (PDFs)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

function createSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized - Please login' });
    }

    // GET - List user's documents (PDFs, etc.)
    if (req.method === 'GET') {
        try {
            const documents = await prisma.content.findMany({
                where: {
                    userId: session.user.id,
                    type: { in: ['PDF', 'DOCUMENT'] },
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    subject: true,
                    subjectSlug: true,
                    type: true,
                    fileUrl: true,
                    fileName: true,
                    fileSize: true,
                    mimeType: true,
                    thumbnail: true,
                    views: true,
                    isPublished: true,
                    createdAt: true,
                },
            });

            return res.status(200).json({ documents });
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            return res.status(500).json({ error: 'Failed to fetch documents' });
        }
    }

    // POST - Upload new document (PDF, etc.)
    if (req.method === 'POST') {
        try {
            const { file, fileName, title, subject, description, isPublished = true } = req.body;

            if (!file || !fileName || !title || !subject) {
                return res.status(400).json({ error: 'File, fileName, title, and subject are required' });
            }

            // Determine content type
            const mimeType = getMimeType(fileName);
            let contentType: 'PDF' | 'DOCUMENT' | 'IMAGE' = 'DOCUMENT';

            if (mimeType === 'application/pdf') {
                contentType = 'PDF';
            } else if (mimeType.startsWith('image/')) {
                contentType = 'IMAGE';
            }

            // Upload to Azure Blob Storage
            const result = await uploadBase64(file, fileName, {
                folder: `documents/${session.user.id}`,
                contentType: mimeType,
            });

            // Calculate file size
            const fileSize = Buffer.from(file.replace(/^data:[^;]+;base64,/, ''), 'base64').length;

            // Create slug
            const slug = createSlug(title);
            const subjectSlug = createSlug(subject);

            // Save to database
            const document = await prisma.content.create({
                data: {
                    title,
                    slug,
                    subject,
                    subjectSlug,
                    type: contentType,
                    fileUrl: result.url,
                    fileName,
                    fileSize,
                    mimeType,
                    description,
                    isPublished,
                    userId: session.user.id,
                },
            });

            return res.status(201).json({
                document,
                message: 'Document uploaded successfully',
            });
        } catch (error) {
            console.error('Failed to upload document:', error);
            return res.status(500).json({ error: 'Failed to upload document' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
