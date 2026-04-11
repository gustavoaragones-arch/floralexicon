/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Required for Docker-style deploys and compatible with OpenNext Cloudflare builds. */
  output: "standalone",
};

export default nextConfig;
