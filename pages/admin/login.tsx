import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AdminLogin() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main login page
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-white text-lg">Redirecting to login...</div>
    </div>
  )
}
