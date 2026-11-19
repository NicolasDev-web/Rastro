// Gera a prévia offline em /preview a partir do build real do Next.js.
// Uso (a partir de apps/web):  npm run preview:static
//
// 1. Faz `next build` num diretório separado (.next-preview), sem conflitar com `next dev`.
// 2. Copia o HTML pré-renderizado de cada página, remove os scripts (a prévia é estática),
//    reescreve links internos para arquivos .html e copia CSS e fontes para preview/assets.
//
// Limitação declarada: sem JavaScript, os componentes interativos (explorador, fluxo)
// aparecem no estado inicial. Os <details> do glossário funcionam normalmente.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(web, '.next-preview');
const out = resolve(web, '../../preview');
const assets = join(out, 'assets');
const routes = { '/': 'index', '/investigacao': 'investigacao', '/mapa': 'mapa', '/parlamentares': 'parlamentares', '/fluxos': 'fluxos', '/reportagens': 'reportagens', '/dados': 'dados', '/glossario': 'glossario', '/componentes': 'componentes',
  // fichas fictícias da aba de autores (modo demo)
  '/parlamentares/demo-a': 'parlamentares-demo-a', '/parlamentares/demo-b': 'parlamentares-demo-b', '/parlamentares/demo-c': 'parlamentares-demo-c' };

if (!process.argv.includes('--skip-build')) {
  execSync('npx next build', { cwd: web, stdio: 'inherit', env: { ...process.env, NEXT_DIST_DIR: '.next-preview' } });
}

rmSync(assets, { recursive: true, force: true });
mkdirSync(join(assets, 'media'), { recursive: true });

const copiedCss = new Set();
const copyCss = href => {
  const file = href.split('/').pop();
  if (!copiedCss.has(file)) {
    let css = readFileSync(join(dist, 'static', 'css', file), 'utf8');
    for (const [, media] of css.matchAll(/\/_next\/static\/media\/([^)"']+)/g)) {
      cpSync(join(dist, 'static', 'media', media), join(assets, 'media', media));
    }
    css = css.replaceAll('/_next/static/media/', 'media/');
    writeFileSync(join(assets, file), css);
    copiedCss.add(file);
  }
  return `assets/${file}`;
};

const localHref = href => {
  const [path, hash] = href.split('#');
  const name = routes[path || '/'];
  if (!name) return href;
  return `${name}.html${hash ? `#${hash}` : ''}`;
};

for (const [route, name] of Object.entries(routes)) {
  const src = join(dist, 'server', 'app', route === '/' ? 'index.html' : `${route.slice(1)}.html`);
  if (!existsSync(src)) throw new Error(`Página não pré-renderizada: ${src}`);
  let html = readFileSync(src, 'utf8');
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<link[^>]+rel="(?:preload|modulepreload)"[^>]*as="script"[^>]*\/?>/g, '')
    .replace(/<link[^>]+as="font"[^>]*\/?>/g, '')
    .replace(/href="(\/_next\/static\/css\/[^"]+)"/g, (_, h) => `href="${copyCss(h)}"`)
    .replace(/href="(\/[^"]*)"/g, (_, h) => `href="${localHref(h)}"`)
    .replace('<head>', '<head><!-- Gerado por apps/web/scripts/build-preview.mjs a partir do build Next.js. Não editar à mão. -->');
  writeFileSync(join(out, `${name}.html`), html);
  console.log(`preview/${name}.html`);
}
console.log(`CSS: ${[...copiedCss].join(', ')}`);
