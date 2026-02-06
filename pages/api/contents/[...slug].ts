import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface Content {
  id: string
  title: string
  subject: string
  htmlCode: string
  cssCode: string
  jsCode: string
  createdAt: string
  updatedAt: string
  slug: string
  subjectSlug: string
}

const dataDir = path.join(process.cwd(), 'data')
const dataFile = path.join(dataDir, 'contents.json')

function readContents(): Content[] {
  try {
    const data = fs.readFileSync(dataFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeContents(contents: Content[]) {
  fs.writeFileSync(dataFile, JSON.stringify(contents, null, 2))
}

function authenticateAdmin(req: NextApiRequest): boolean {
  const token = req.headers.authorization?.replace('Bearer ', '')
  return token?.startsWith('secret-token-') || false
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  const slugArray = Array.isArray(slug) ? slug : [slug]

  // Handle /api/contents/[subjectSlug]/[titleSlug]
  if (slugArray.length === 2) {
    const [subjectSlug, titleSlug] = slugArray

    if (req.method === 'GET') {
      const contents = readContents()
      const content = contents.find(
        (c) => c.subjectSlug === subjectSlug && c.slug === titleSlug
      )

      if (!content) {
        return res.status(404).json({ error: 'Content not found' })
      }

      return res.status(200).json(content)
    }
  }

  // Handle /api/contents/[id] for delete and update
  if (slugArray.length === 1) {
    const id = slugArray[0]

    if (req.method === 'GET') {
      const contents = readContents()
      const content = contents.find((c) => c.id === id)

      if (!content) {
        return res.status(404).json({ error: 'Content not found' })
      }

      return res.status(200).json(content)
    }

    if (req.method === 'PUT') {
      if (!authenticateAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { title, subject, htmlCode, cssCode, jsCode } = req.body
      const contents = readContents()
      const index = contents.findIndex((c) => c.id === id)

      if (index === -1) {
        return res.status(404).json({ error: 'Content not found' })
      }

      contents[index] = {
        ...contents[index],
        title: title || contents[index].title,
        subject: subject || contents[index].subject,
        htmlCode: htmlCode ?? contents[index].htmlCode,
        cssCode: cssCode ?? contents[index].cssCode,
        jsCode: jsCode ?? contents[index].jsCode,
        updatedAt: new Date().toISOString(),
      }

      writeContents(contents)
      return res.status(200).json(contents[index])
    }

    if (req.method === 'DELETE') {
      if (!authenticateAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const contents = readContents()
      const filtered = contents.filter((c) => c.id !== id)

      if (filtered.length === contents.length) {
        return res.status(404).json({ error: 'Content not found' })
      }

      writeContents(filtered)
      return res.status(200).json({ message: 'Content deleted' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
