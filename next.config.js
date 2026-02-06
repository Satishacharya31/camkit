/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
      },
    ],
  },
}

module.exports = nextConfig
