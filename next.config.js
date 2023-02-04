/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_MAPBOX_API_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN,
    NEXT_PUBLIC_TWITTER_BEARER_TOKEN: process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN
  },
  async headers() {
    return [
      {
        source: '/client/pages/map.tsx',
        headers: [
          {
            key: 'Accept',
            value: 'application/json',
          },
          {
            key: 'Authorization',
            value: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY,
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
