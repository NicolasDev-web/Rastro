/** @type {import('next').NextConfig} */
// NEXT_DIST_DIR permite gerar a prévia estática (.next-preview) sem conflitar com `next dev`.
const nextConfig = { reactStrictMode: true, distDir: process.env.NEXT_DIST_DIR || '.next' };
export default nextConfig;
