import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="utf-8" />
                <link rel="icon" href="/favicon.ico" />
                {/* Global SEO Meta Tags */}
                <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
                <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
