import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET - Get user settings
    if (req.method === 'GET') {
        try {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    createdAt: true,
                },
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({ user });
        } catch (error) {
            console.error('Failed to fetch user settings:', error);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    // PUT - Update user settings
    if (req.method === 'PUT') {
        try {
            const { name, image } = req.body;

            const updateData: { name?: string; image?: string } = {};

            if (name !== undefined) {
                if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
                    return res.status(400).json({ error: 'Name must be 1-100 characters' });
                }
                updateData.name = name.trim();
            }

            if (image !== undefined) {
                if (typeof image !== 'string') {
                    return res.status(400).json({ error: 'Invalid image URL' });
                }
                updateData.image = image;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            const updatedUser = await prisma.user.update({
                where: { id: session.user.id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            });

            return res.status(200).json({
                user: updatedUser,
                message: 'Settings updated successfully',
            });
        } catch (error) {
            console.error('Failed to update user settings:', error);
            return res.status(500).json({ error: 'Failed to update settings' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
