import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const session = await getServerSession(req, res, authOptions)

        if (!session?.user || !(session.user as any).isAdmin) {
            return res.status(403).json({ error: 'Unauthorized - Admin access required' })
        }

        const contents = await prisma.content.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return res.status(200).json({ contents })
    } catch (error) {
        console.error('Admin contents error:', error)
        return res.status(500).json({ error: 'Failed to fetch contents' })
    }
}
