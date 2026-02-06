import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || !Array.isArray(slug) || slug.length !== 2) {
    return res.status(400).json({ error: 'Invalid slug format' });
  }

  const [subjectSlug, contentSlug] = slug;

  if (req.method === 'GET') {
    try {
      const content = await prisma.content.findUnique({
        where: {
          subjectSlug_slug: { subjectSlug, slug: contentSlug },
        },
        include: {
          user: { select: { name: true, image: true } },
        },
      });

      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Increment views
      await prisma.content.update({
        where: { id: content.id },
        data: { views: { increment: 1 } },
      });

      return res.status(200).json(content);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      return res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
