import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Public, return all published content with optional search
  if (req.method === 'GET') {
    try {
      const { search, subject, category, sortBy = 'createdAt', order = 'desc' } = req.query;

      // Build where clause
      const where: any = { isPublished: true };

      // Search filter - searches in title and subject
      if (search && typeof search === 'string') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Subject filter (legacy)
      if (subject && typeof subject === 'string') {
        where.subject = subject;
      }

      // Category filter (new)
      if (category && typeof category === 'string') {
        where.category = { slug: category };
      }

      // Validate sort field
      const validSortFields = ['createdAt', 'views', 'title'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
      const sortOrder = order === 'asc' ? 'asc' : 'desc';

      const contents = await prisma.content.findMany({
        where,
        orderBy: { [sortField as string]: sortOrder },
        select: {
          id: true,
          title: true,
          subject: true,
          subjectSlug: true,
          slug: true,
          htmlCode: true,
          cssCode: true,
          jsCode: true,
          views: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          type: true,
          thumbnail: true,
          category: {
            select: {
              name: true,
              slug: true,
              color: true
            }
          }
        }
      })
      return res.status(200).json(contents)
    } catch (error) {
      console.error('Error fetching contents:', error)
      return res.status(500).json({ error: 'Failed to fetch contents' })
    }
  }

  // POST - Create new content (requires auth)
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions)

      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized - Please login' })
      }

      const { title, subject, htmlCode, cssCode, jsCode, isPublished } = req.body

      if (!title || !subject) {
        return res.status(400).json({ error: 'Title and subject are required' })
      }

      const newContent = await prisma.content.create({
        data: {
          title,
          subject,
          slug: createSlug(title),
          subjectSlug: createSlug(subject),
          htmlCode: htmlCode || '',
          cssCode: cssCode || '',
          jsCode: jsCode || '',
          type: req.body.type || 'CODE',
          fileUrl: req.body.fileUrl || null,
          thumbnail: req.body.thumbnail || null,
          isPublished: isPublished ?? false,
          userId: session.user.id,
        }
      })

      return res.status(201).json(newContent)
    } catch (error) {
      console.error('Error creating content:', error)
      return res.status(500).json({ error: 'Failed to create content' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
