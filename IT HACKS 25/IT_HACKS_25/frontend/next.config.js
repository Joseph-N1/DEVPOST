/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Phase 9: PWA Configuration
  // Service worker is manually managed in public/service-worker.js
  // and registered in _app.js for full control over caching strategies
  
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
