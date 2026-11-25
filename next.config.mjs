/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiOrigin = process.env.API_BASE_URL || "http://127.0.0.1:3001"
    return ["auth", "users", "listings", "orders"].map((route) => ({
      source: `/api/${route}/:path*`,
      destination: `${apiOrigin}/api/${route}/:path*`,
    }))
  },
}

export default nextConfig
