import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import formidable from 'formidable';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteByUrl, getMimeType, uploadBase64, uploadStream } from '@/lib/azure-storage';

export const config = {
    api: {
        bodyParser: false,
    },
};

const MAX_ASSET_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;

const readJsonBody = async (req: NextApiRequest): Promise<any> => {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (!chunks.length) {
        return {};
    }

    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const firstValue = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized - Please login' });
    }

    // GET - List user's assets
    if (req.method === 'GET') {
        try {
            const { folder } = req.query;

            const assets = await prisma.asset.findMany({
                where: {
                    userId: session.user.id,
                    ...(folder ? { folder: folder as string } : {}),
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    url: true,
                    thumbnailUrl: true,
                    mimeType: true,
                    size: true,
                    width: true,
                    height: true,
                    folder: true,
                    createdAt: true,
                },
            });

            return res.status(200).json({ assets });
        } catch (error) {
            console.error('Failed to fetch assets:', error);
            return res.status(500).json({ error: 'Failed to fetch assets' });
        }
    }

    // POST - Upload new asset metadata or file
    if (req.method === 'POST') {
        try {
            const contentType = req.headers['content-type'] || '';

            let fileName: string | undefined;
            let url: string | undefined;
            let size: number | undefined;
            let mimeType: string | undefined;
            let width: number | undefined;
            let height: number | undefined;
            let folder = 'general';
            let file: string | undefined;
            let uploadedFilePath: string | undefined;

            if (contentType.includes('multipart/form-data')) {
                const form = formidable({
                    maxFileSize: MAX_DOCUMENT_SIZE_BYTES,
                    multiples: false,
                    keepExtensions: true,
                });

                const [fields, files] = await form.parse(req);
                const uploadFile = Array.isArray(files.file) ? files.file[0] : files.file;

                fileName = firstValue(fields.fileName) || uploadFile?.originalFilename || undefined;
                folder = firstValue(fields.folder) || folder;
                mimeType = firstValue(fields.mimeType) || uploadFile?.mimetype || undefined;
                size = firstValue(fields.size) ? Number(firstValue(fields.size)) : uploadFile?.size;
                width = firstValue(fields.width) ? Number(firstValue(fields.width)) : undefined;
                height = firstValue(fields.height) ? Number(firstValue(fields.height)) : undefined;

                if (!uploadFile) {
                    return res.status(400).json({ error: 'file is required' });
                }

                const uploaded = await uploadStream(fs.createReadStream(uploadFile.filepath), fileName || uploadFile.originalFilename || 'upload', {
                    folder: `assets/${session.user.id}/${folder}`,
                    contentType: mimeType || uploadFile.mimetype || getMimeType(fileName || uploadFile.originalFilename || 'upload'),
                });

                url = uploaded.url;
                file = uploaded.blobName;
                await fs.promises.unlink(uploadFile.filepath).catch(() => {});
            } else {
                const body = await readJsonBody(req);
                ({ file, fileName, url, size, mimeType, width, height, folder = 'general' } = body);
            }

            if (!fileName) {
                return res.status(400).json({ error: 'fileName is required' });
            }

            // Create slug from filename
            const slug = fileName
                .toLowerCase()
                .replace(/[^a-z0-9.]+/g, '-')
                .replace(/(^-|-$)/g, '');

            let assetUrl = url;
            const assetMimeType = mimeType || getMimeType(fileName);
            let bufferSize = size || 0;

            // Optional base64 fallback (useful for small uploads via old method)
            if (!url && file) {
                bufferSize = Buffer.from(file.replace(/^data:[^;]+;base64,/, ''), 'base64').length;
                const maxAllowedSize = folder === 'content-pdfs' ? MAX_DOCUMENT_SIZE_BYTES : MAX_ASSET_SIZE_BYTES;

                if (bufferSize > maxAllowedSize) {
                    const maxLabel = folder === 'content-pdfs' ? '50MB' : '10MB';
                    return res.status(413).json({ error: `File too large. Maximum size is ${maxLabel}.` });
                }

                // Upload to Azure Blob Storage
                const result = await uploadBase64(file, fileName, {
                    folder: `assets/${session.user.id}/${folder}`,
                    contentType: assetMimeType,
                });
                
                assetUrl = result.url;
            } else if (!url) {
                return res.status(400).json({ error: 'file or url is required' });
            }

            // Save to database
            const asset = await prisma.asset.create({
                data: {
                    name: fileName,
                    slug,
                    url: assetUrl,
                    mimeType: assetMimeType,
                    size: bufferSize,
                    width,
                    height,
                    folder,
                    userId: session.user.id,
                },
            });

            return res.status(201).json({
                asset,
                message: 'Asset uploaded successfully',
            });
        } catch (error) {
            console.error('Failed to upload asset:', error);
            return res.status(500).json({ error: 'Failed to upload asset' });
        }
    }

    // DELETE - Delete asset by ID
    if (req.method === 'DELETE') {
        try {
            const { id } = await readJsonBody(req);

            if (!id) {
                return res.status(400).json({ error: 'Asset ID is required' });
            }

            // Find the asset
            const asset = await prisma.asset.findFirst({
                where: {
                    id,
                    userId: session.user.id,
                },
            });

            if (!asset) {
                return res.status(404).json({ error: 'Asset not found' });
            }

            // Delete from Azure Blob Storage
            await deleteByUrl(asset.url);
            if (asset.thumbnailUrl) {
                await deleteByUrl(asset.thumbnailUrl);
            }

            // Delete from database
            await prisma.asset.delete({
                where: { id },
            });

            return res.status(200).json({ message: 'Asset deleted successfully' });
        } catch (error) {
            console.error('Failed to delete asset:', error);
            return res.status(500).json({ error: 'Failed to delete asset' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
