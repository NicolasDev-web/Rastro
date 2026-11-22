// Gera o site publicado (ADR-015) em RASTRO/dist/rastro, pronto para `vercel deploy --archive=tgz`.
// Uso (a partir de apps/web):
//   node scripts/build-publicado.mjs [--skip-build]   build + cópia + trava + vercel.json
//   node scripts/build-publicado.mjs --check <pasta>  só a trava, sobre uma pasta qualquer (testes)
//
// 1. `next build` com DATA_MODE=publicado (export estático; lê data/publicado, ver `python pipelines/run.py publicar`).
// 2. Remove rotas internas (galeria de componentes) e copia o resultado para dist/rastro.
// 3. Trava: recusa a publicação se HTML/RSC/JS/JSON/CSS trouxer aviso de demo/validação, dado pessoal
//    (CPF, MEI ou e-mail fora do contato), caminho local, chave de API ou source map (auditoria SENTINEL).
// 4. Grava vercel.json com cabeçalhos de segurança.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTACT_EMAIL = 'nicolasxavier445@gmail.com';
const SCANNED = /\.(html|txt|js|json|css)$/;
export const FORBIDDEN = [
  [/NÃO PUBLICAR/i, 'aviso de validação'], [/EM VALIDAÇÃO/i, 'aviso de validação'], [/fictíci/i, 'aviso de demo'],
  [/PROTÓTIPO CONCEITUAL/i, 'aviso de demo'], [/conceito demonstrativo/i, 'aviso de demo'],
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, 'CPF'], [/\*{3}\.\d{3}\.\d{3}-\*{2}/, 'CPF parcialmente mascarado'],
  [/\b\d{2}\.\d{3}\.\d{3} [A-ZÀ-Ý]{2,}/, 'nome de empresário individual (MEI)'],
  [/[A-Z]:[\\/]+Users[\\/]/i, 'caminho local'], [/PORTAL_API_KEY|chave-api-dados/i, 'chave de API'],
  [/sourceMappingURL/, 'source map'],
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

export const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

/** Varre a pasta e devolve os problemas encontrados (lista vazia = publicável). */
export function scan(root) {
  const problems = [];
  let pages = 0;
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name);
      if (statSync(file).isDirectory()) { walk(file); continue; }
      if (!SCANNED.test(name)) continue;
      if (name.endsWith('.html')) pages++;
      const text = readFileSync(file, 'utf8');
      const rel = file.slice(root.length + 1);
      for (const [re, label] of FORBIDDEN) if (re.test(text)) problems.push(`${rel}: ${label}`);
      for (const email of text.match(EMAIL) ?? []) {
        // nomes de arquivo como "foto@2x.png" não são e-mails; o resto só pode ser o contato público
        if (!/\.(png|jpe?g|webp|svg|gif|js|css|woff2?)$/i.test(email) && email.toLowerCase() !== CONTACT_EMAIL) problems.push(`${rel}: e-mail fora do contato (${email.replace(/^(.{3}).*@/, '$1***@')})`);
      }
    }
  };
  walk(root);
  return { pages, problems };
}

function main() {
  const check = process.argv.indexOf('--check');
  if (check !== -1) {
    const { pages, problems } = scan(resolve(process.argv[check + 1]));
    if (problems.length) { console.error(`Publicação recusada:\n${problems.slice(0, 20).join('\n')}`); process.exit(1); }
    console.log(`[check] ${pages} páginas sem problemas`);
    return;
  }
  const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  // O registro de investigação (ADR-014) descreve casos de um snapshot. Com dados novos, ele precisa ser
  // revisto antes de ir ao ar; senão as fichas mostrariam achados de outra extração (ATUALIZACAO-DADOS.md).
  const bundleSnap = JSON.parse(readFileSync(resolve(web, '../../data/publicado/active-bundle.json'), 'utf8')).snapshot;
  const casosSnap = JSON.parse(readFileSync(resolve(web, '../../pipelines/contracts/investigacao_casos.json'), 'utf8')).snapshot;
  if (bundleSnap !== casosSnap) throw new Error(`Publicação recusada: o pacote é do snapshot ${String(bundleSnap).slice(0, 8)}, mas o registro de investigação é do ${String(casosSnap).slice(0, 8)}. Revise os casos (docs/operations/ATUALIZACAO-DADOS.md, passo 5).`);
  const built = join(web, '.next-publicado');
  const out = resolve(web, '../../dist/rastro');
  if (!process.argv.includes('--skip-build')) {
    rmSync(built, { recursive: true, force: true });
    execSync('npx next build', { cwd: web, stdio: 'inherit', env: { ...process.env, DATA_MODE: 'publicado', NEXT_DIST_DIR: '.next-publicado' } });
  }
  if (!existsSync(join(built, 'index.html'))) throw new Error('Export estático ausente em .next-publicado');
  rmSync(out, { recursive: true, force: true });
  cpSync(built, out, { recursive: true }); // export estático: só páginas, _next/static e assets públicos
  for (const f of ['componentes.html', 'componentes.txt']) rmSync(join(out, f), { force: true });
  const { pages, problems } = scan(out);
  if (problems.length) throw new Error(`Publicação recusada:\n${problems.slice(0, 20).join('\n')}`);
  writeFileSync(join(out, 'vercel.json'), JSON.stringify({ cleanUrls: true, trailingSlash: false, headers: [{ source: '/(.*)', headers: SECURITY_HEADERS }] }, null, 2) + '\n');
  console.log(`[publicado] ${pages} páginas em dist/rastro: sem avisos de demo/validação, dados pessoais, caminhos locais, chaves ou source maps.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
