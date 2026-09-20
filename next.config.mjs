/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure the mongodb driver is treated as an external server package
  // and never bundled into any client boundary.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
