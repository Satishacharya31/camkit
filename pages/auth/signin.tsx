import { useEffect } from 'react'
import { useRouter } from 'next/router'

interface Props {}

export default function SignIn({}: Props) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to unified login page
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-white text-lg">Redirecting to login...</div>
    </div>
  )
}
