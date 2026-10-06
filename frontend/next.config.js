/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "169.254.83.107",
    "192.168.29.7",
    "localhost",
  ],
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
