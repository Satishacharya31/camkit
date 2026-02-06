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
  const { slug } = req.query
  const slugArray = Array.isArray(slug) ? slug : [slug]

  // Handle /api/contents/[subjectSlug]/[titleSlug]
  if (slugArray.length === 2) {
    const [subjectSlug, titleSlug] = slugArray

    if (req.method === 'GET') {
      try {
        const content = await prisma.content.findFirst({
          where: {
            subjectSlug,
            slug: titleSlug,
          }
        })

        if (!content) {
          return res.status(404).json({ error: 'Content not found' })
        }

        // Increment views
        await prisma.content.update({
          where: { id: content.id },
          data: { views: { increment: 1 } }
        })

        return res.status(200).json(content)
      } catch (error) {
        console.error('Error fetching content:', error)
        return res.status(500).json({ error: 'Failed to fetch content' })
      }
    }
  }

  // Handle /api/contents/[id] for GET, PUT, DELETE
  if (slugArray.length === 1) {
    const id = slugArray[0]

    if (req.method === 'GET') {
      try {
        const content = await prisma.content.findUnique({
          where: { id }
        })

        if (!content) {
          return res.status(404).json({ error: 'Content not found' })
        }

        return res.status(200).json(content)
      } catch (error) {
        console.error('Error fetching content:', error)
        return res.status(500).json({ error: 'Failed to fetch content' })
      }
    }

    if (req.method === 'PUT') {
      try {
        const session = await getServerSession(req, res, authOptions)

        if (!session?.user?.id) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const content = await prisma.content.findUnique({
          where: { id }
        })

        if (!content) {
          return res.status(404).json({ error: 'Content not found' })
        }

        // Check if user owns the content or is admin
        const isAdmin = (session.user as any).isAdmin
        if (content.userId !== session.user.id && !isAdmin) {
          return res.status(403).json({ error: 'Not authorized to edit this content' })
        }

        const { title, subject, htmlCode, cssCode, jsCode, isPublished } = req.body

        const updated = await prisma.content.update({
          where: { id },
          data: {
            title: title || content.title,
            subject: subject || content.subject,
            slug: title ? createSlug(title) : content.slug,
            subjectSlug: subject ? createSlug(subject) : content.subjectSlug,
            htmlCode: htmlCode ?? content.htmlCode,
            cssCode: cssCode ?? content.cssCode,
            jsCode: jsCode ?? content.jsCode,
            isPublished: isPublished ?? content.isPublished,
          }
        })

        return res.status(200).json(updated)
      } catch (error) {
        console.error('Error updating content:', error)
        return res.status(500).json({ error: 'Failed to update content' })
      }
    }

    if (req.method === 'DELETE') {
      try {
        const session = await getServerSession(req, res, authOptions)

        if (!session?.user?.id) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const content = await prisma.content.findUnique({
          where: { id }
        })

        if (!content) {
          return res.status(404).json({ error: 'Content not found' })
        }

        // Check if user owns the content or is admin
        const isAdmin = (session.user as any).isAdmin
        if (content.userId !== session.user.id && !isAdmin) {
          return res.status(403).json({ error: 'Not authorized to delete this content' })
        }

        await prisma.content.delete({
          where: { id }
        })

        return res.status(200).json({ message: 'Content deleted' })
      } catch (error) {
        console.error('Error deleting content:', error)
        return res.status(500).json({ error: 'Failed to delete content' })
      }
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
