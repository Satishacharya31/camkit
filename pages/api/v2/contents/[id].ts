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
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  // GET - Fetch single content
  if (req.method === 'GET') {
    try {
      const content = await prisma.content.findUnique({
        where: { id },
        include: {
          user: {
            select: { name: true, email: true, image: true },
          },
        },
      });

      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Increment views
      await prisma.content.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      return res.status(200).json(content);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      return res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  // PUT - Update content
  if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const content = await prisma.content.findUnique({
        where: { id },
      });

      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Check ownership or admin
      const isAdmin = session.user.isAdmin;
      if (content.userId !== session.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { title, subject, htmlCode, cssCode, jsCode, isPublished } = req.body;

      const slug = title ? createSlug(title) : content.slug;
      const subjectSlug = subject ? createSlug(subject) : content.subjectSlug;

      const updated = await prisma.content.update({
        where: { id },
        data: {
          title: title || content.title,
          subject: subject || content.subject,
          slug,
          subjectSlug,
          htmlCode: htmlCode ?? content.htmlCode,
          cssCode: cssCode ?? content.cssCode,
          jsCode: jsCode ?? content.jsCode,
          isPublished: isPublished ?? content.isPublished,
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Failed to update content:', error);
      return res.status(500).json({ error: 'Failed to update content' });
    }
  }

  // DELETE - Delete content
  if (req.method === 'DELETE') {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const content = await prisma.content.findUnique({
        where: { id },
      });

      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Check ownership or admin
      const isAdmin = session.user.isAdmin;
      if (content.userId !== session.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await prisma.content.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Content deleted' });
    } catch (error) {
      console.error('Failed to delete content:', error);
      return res.status(500).json({ error: 'Failed to delete content' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
