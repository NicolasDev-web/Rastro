// Gera o site publicado (ADR-015) em RASTRO/dist/rastro, pronto para `vercel deploy`.
// Uso (a partir de apps/web):  node scripts/build-publicado.mjs [--skip-build]
//
// 1. `next build` com DATA_MODE=publicado (export estático; lê data/publicado, ver `python pipelines/run.py publicar`).
// 2. Remove rotas internas (galeria de componentes) e copia o resultado para dist/rastro.
// 3. Recusa a publicação se algum HTML/RSC trouxer aviso de demo/validação ou algo com formato de CPF.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const built = join(web, '.next-publicado');
const out = resolve(web, '../../dist/rastro');
const INTERNAL = ['componentes.html', 'componentes.txt'];
const FORBIDDEN = [/NÃO PUBLICAR/i, /EM VALIDAÇÃO/i, /fictíci/i, /PROTÓTIPO CONCEITUAL/i, /conceito demonstrativo/i, /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/];

if (!process.argv.includes('--skip-build')) {
  rmSync(built, { recursive: true, force: true });
  execSync('npx next build', { cwd: web, stdio: 'inherit', env: { ...process.env, DATA_MODE: 'publicado', NEXT_DIST_DIR: '.next-publicado' } });
}
if (!existsSync(join(built, 'index.html'))) throw new Error('Export estático ausente em .next-publicado');

rmSync(out, { recursive: true, force: true });
cpSync(built, out, { recursive: true }); // export estático: só páginas, _next/static e assets públicos
for (const f of INTERNAL) rmSync(join(out, f), { force: true });

const problems = [];
let pages = 0;
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) { walk(file); continue; }
    if (!/\.(html|txt)$/.test(name)) continue;
    if (name.endsWith('.html')) pages++;
    const text = readFileSync(file, 'utf8');
    for (const re of FORBIDDEN) if (re.test(text)) problems.push(`${file.slice(out.length + 1)}: ${re}`);
  }
};
walk(out);
if (problems.length) throw new Error(`Publicação recusada:\n${problems.slice(0, 20).join('\n')}`);

writeFileSync(join(out, 'vercel.json'), JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2) + '\n');
console.log(`[publicado] ${pages} páginas em dist/rastro, sem avisos de demo/validação nem CPF.`);
