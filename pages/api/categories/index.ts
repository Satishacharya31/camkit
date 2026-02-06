import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const categories = await prisma.category.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { contents: true }
                    }
                }
            });
            return res.status(200).json(categories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
