/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MAPBOX_API_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN,
    NEXT_PUBLIC_TWITTER_BEARER_TOKEN: process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN
  },
}

module.exports = nextConfig
