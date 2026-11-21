// Malha municipal do Ceará para o mapa de /mapa (SPEC 04 T04.03, ADR-017).
// Uso (a partir de apps/web): node scripts/gerar-malha-ce.mjs [--offline]
// 1. Baixa a malha da API do IBGE (v3, qualidade mínima) e guarda a cópia bruta com SHA-256 em data/malha/.
//    --offline reaproveita a cópia bruta já baixada.
// 2. Projeta (equiretangular corrigida pela latitude média) e grava os caminhos SVG em lib/malha-ce.json.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL_IBGE = 'https://servicodados.ibge.gov.br/api/v3/malhas/estados/23?formato=application/vnd.geo+json&intrarregiao=municipio&qualidade=minima';
const rawDir = join(web, '../../data/malha');
const rawFile = join(rawDir, 'ibge-ce-municipios-minima.geojson');
const metaFile = join(rawDir, 'ibge-ce-municipios-minima.meta.json');

let raw, baixadoEm;
if (process.argv.includes('--offline')) {
  raw = readFileSync(rawFile);
  baixadoEm = JSON.parse(readFileSync(metaFile, 'utf8')).baixado_em;
} else {
  const res = await fetch(URL_IBGE, { headers: { 'User-Agent': 'rastro-malha' } });
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
  raw = Buffer.from(await res.arrayBuffer());
  baixadoEm = new Date().toISOString();
  mkdirSync(rawDir, { recursive: true });
  writeFileSync(rawFile, raw);
}
const sha256 = createHash('sha256').update(raw).digest('hex');
if (!existsSync(metaFile) || !process.argv.includes('--offline')) writeFileSync(metaFile, JSON.stringify({ fonte: 'IBGE — API de malhas v3', url: URL_IBGE, baixado_em: baixadoEm, sha256 }, null, 2));

const geo = JSON.parse(raw.toString('utf8'));
if (geo.features?.length !== 184) throw new Error(`Esperados 184 municípios, vieram ${geo.features?.length}`);

let [minX, minY, maxX, maxY] = [180, 90, -180, -90];
const walk = (c, f) => (typeof c[0] === 'number' ? f(c) : c.forEach(x => walk(x, f)));
for (const f of geo.features) walk(f.geometry.coordinates, ([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
const k = Math.cos(((minY + maxY) / 2) * Math.PI / 180);
const W = 600, s = W / ((maxX - minX) * k), H = Math.round((maxY - minY) * s);
const pt = ([x, y]) => `${((x - minX) * k * s).toFixed(1)} ${((maxY - y) * s).toFixed(1)}`;
const ring = r => 'M' + r.map(pt).join('L') + 'Z';
const path = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(p => p.map(ring).join('')).join('');

const paths = Object.fromEntries(geo.features.map(f => [String(f.properties.codarea), path(f.geometry)]));
const out = { fonte: 'IBGE — Malha municipal (API de malhas v3, qualidade mínima)', url: URL_IBGE, baixado_em: baixadoEm, sha256, viewBox: `0 0 ${W} ${H}`, paths };
writeFileSync(join(web, 'lib/malha-ce.json'), JSON.stringify(out));
console.log(`[malha] ${Object.keys(paths).length} municípios · ${(JSON.stringify(out).length / 1024).toFixed(0)} KB · sha256 ${sha256.slice(0, 12)}`);
