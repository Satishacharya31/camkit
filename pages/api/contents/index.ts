import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export interface Content {
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

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Ensure data file exists
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([], null, 2))
}

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

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const contents = readContents()
    return res.status(200).json(contents)
  }

  if (req.method === 'POST') {
    if (!authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { title, subject, htmlCode, cssCode, jsCode } = req.body

    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and subject are required' })
    }

    const contents = readContents()
    const now = new Date().toISOString()
    
    const newContent: Content = {
      id: Date.now().toString(),
      title,
      subject,
      htmlCode: htmlCode || '',
      cssCode: cssCode || '',
      jsCode: jsCode || '',
      createdAt: now,
      updatedAt: now,
      slug: createSlug(title),
      subjectSlug: createSlug(subject),
    }

    contents.push(newContent)
    writeContents(contents)

    return res.status(201).json(newContent)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export { readContents, writeContents, authenticateAdmin, createSlug }
