/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'via.placeholder.com',
      'placekitten.com',
      'picsum.photos'
    ]
  },
  typescript: {
    ignoreBuildErrors: true
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false};
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://api.mapbox.com",
              "worker-src 'self' blob: https://api.mapbox.com",
              "child-src 'self' blob: https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.mapbox.com https://via.placeholder.com https://placekitten.com https://picsum.photos",
              "connect-src 'self' https://*.mapbox.com https://events.mapbox.com data: blob:",
              "font-src 'self'",
              "frame-src 'self'",
              "object-src 'none'",
              "manifest-src 'self'"
            ].join('; ')
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig