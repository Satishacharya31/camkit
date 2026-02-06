import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import ErrorBoundary from '../components/ErrorBoundary'
import '../styles/globals.css'

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </ThemeProvider>
    </SessionProvider>
  )
}

export default MyApp
