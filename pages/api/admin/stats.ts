import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!session.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const [
        totalUsers,
        totalContents,
        totalViews,
        publishedCount,
        recentUsers,
        recentContents,
        topContent,
        subjectStats,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.content.count(),
        prisma.content.aggregate({ _sum: { views: true } }),
        prisma.content.count({ where: { isPublished: true } }),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, image: true, createdAt: true },
        }),
        prisma.content.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        }),
        prisma.content.findMany({
          take: 5,
          orderBy: { views: 'desc' },
          select: { id: true, title: true, views: true, subject: true },
        }),
        prisma.content.groupBy({
          by: ['subject'],
          _count: { id: true },
          _sum: { views: true },
        }),
      ]);

      return res.status(200).json({
        totalUsers,
        totalContents,
        totalViews: totalViews._sum.views || 0,
        publishedCount,
        draftCount: totalContents - publishedCount,
        recentUsers,
        recentContents,
        topContent,
        subjectStats: subjectStats.map((s) => ({
          name: s.subject,
          count: s._count.id,
          views: s._sum.views || 0,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
