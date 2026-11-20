/** @type {import('next').NextConfig} */
// NEXT_DIST_DIR permite gerar a prévia estática (.next-preview) sem conflitar com `next dev`.
import { fileURLToPath } from 'node:url';
// DATA_MODE=publicado gera site 100% estático em out/ (ADR-015): nenhum dado bruto ou servidor vai para o deploy.
const publicado = process.env.DATA_MODE === 'publicado';
const nextConfig = { reactStrictMode: true, outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)), distDir: process.env.NEXT_DIST_DIR || '.next',
  // Só o diretório de dados do modo ativo aparece no código compilado (publicado lê a cópia congelada).
  env: { RASTRO_DATA_DIR: publicado ? '../../data/publicado' : process.env.DATA_MODE === 'validacao' ? '../../data/validacao' : '../../data/demo-sem-dados-reais' },
  outputFileTracingExcludes: { '*': ['../../data/**', '../../raw_data/**'] },
  ...(publicado ? { output: 'export', trailingSlash: false } : {}) };
export default nextConfig;
