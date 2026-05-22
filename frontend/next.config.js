/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const rewrites = [];
    
    // Only add the rewrite if NEXT_PUBLIC_API_URL is defined
    if (process.env.NEXT_PUBLIC_API_URL) {
      rewrites.push({
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      });
    }
    
    return rewrites;
  },
};

module.exports = nextConfig;
