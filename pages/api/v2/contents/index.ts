import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      const where = userId ? { userId: userId as string } : {};
      
      const contents = await prisma.content.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(contents);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      return res.status(500).json({ error: 'Failed to fetch contents' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, subject, htmlCode, cssCode, jsCode, isPublished } = req.body;

      if (!title || !subject) {
        return res.status(400).json({ error: 'Title and subject are required' });
      }

      const slug = createSlug(title);
      const subjectSlug = createSlug(subject);

      // Check for duplicate slug
      const existing = await prisma.content.findUnique({
        where: { subjectSlug_slug: { subjectSlug, slug } },
      });

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const content = await prisma.content.create({
        data: {
          title,
          subject,
          slug: finalSlug,
          subjectSlug,
          htmlCode: htmlCode || '',
          cssCode: cssCode || '',
          jsCode: jsCode || '',
          isPublished: isPublished ?? true,
          userId: session.user.id,
        },
      });

      return res.status(201).json(content);
    } catch (error) {
      console.error('Failed to create content:', error);
      return res.status(500).json({ error: 'Failed to create content' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
