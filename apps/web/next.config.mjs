/** @type {import('next').NextConfig} */
// NEXT_DIST_DIR permite gerar a prévia estática (.next-preview) sem conflitar com `next dev`.
import { fileURLToPath } from 'node:url';
const nextConfig = { reactStrictMode: true, outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)), distDir: process.env.NEXT_DIST_DIR || '.next' };
export default nextConfig;
