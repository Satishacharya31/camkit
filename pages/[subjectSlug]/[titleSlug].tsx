import { GetServerSideProps } from 'next'
import fs from 'fs'
import path from 'path'

interface Content {
  id: string
  title: string
  subject: string
  htmlCode: string
  cssCode: string
  jsCode: string
}

interface Props {
  content: Content | null
}

export default function ContentPage({ content }: Props) {
  if (!content) {
    return null
  }

  // Build complete standalone HTML document
  const fullDocument = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${content.title}</title>
<style>
${content.cssCode}
</style>
</head>
<body>
${content.htmlCode}
<script>
${content.jsCode}
</script>
</body>
</html>`

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
      <iframe
        srcDoc={fullDocument}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
          display: 'block',
        }}
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
        title={content.title}
      />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const subjectSlug = params?.subjectSlug as string
  const titleSlug = params?.titleSlug as string

  if (!subjectSlug || !titleSlug) {
    return { props: { content: null } }
  }

  try {
    const dataFile = path.join(process.cwd(), 'data', 'contents.json')
    
    if (!fs.existsSync(dataFile)) {
      return { props: { content: null } }
    }

    const data = fs.readFileSync(dataFile, 'utf-8')
    const contents = JSON.parse(data)
    
    const content = contents.find(
      (c: Content & { slug: string; subjectSlug: string }) => 
        c.subjectSlug === subjectSlug && c.slug === titleSlug
    )

    if (!content) {
      return { props: { content: null } }
    }

    return {
      props: {
        content: {
          id: content.id,
          title: content.title,
          subject: content.subject,
          htmlCode: content.htmlCode || '',
          cssCode: content.cssCode || '',
          jsCode: content.jsCode || '',
        },
      },
    }
  } catch {
    return { props: { content: null } }
  }
}
