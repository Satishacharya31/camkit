import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateUploadUrl, getMimeType } from '@/lib/azure-storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized - Please login' });
    }

    if (req.method === 'POST') {
        try {
            const { fileName, folder = 'general' } = req.body;

            if (!fileName) {
                return res.status(400).json({ error: 'fileName is required' });
            }

            const mimeType = getMimeType(fileName);
            const result = await generateUploadUrl(fileName, {
                folder: `assets/${session.user.id}/${folder}`,
                contentType: mimeType,
            });

            return res.status(200).json({ 
                uploadUrl: result.uploadUrl,
                url: result.url,
                fileName: result.blobName.split('/').pop(),
                mimeType
            });
        } catch (error) {
            console.error('Failed to generate upload URL:', error);
            return res.status(500).json({ error: 'Failed to generate upload URL' });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}