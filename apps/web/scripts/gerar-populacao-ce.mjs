// População dos municípios do Ceará (Censo 2022) para a reportagem 02 (SPEC 03, incremento 2).
// Uso (a partir de apps/web): node scripts/gerar-populacao-ce.mjs [--offline]
// 1. Baixa a população residente do Censo 2022 (IBGE, SIDRA, agregado 4709, variável 93) e guarda a
//    cópia bruta com SHA-256 em data/populacao/. --offline reaproveita a cópia bruta já baixada.
// 2. Grava lib/populacao-ce.json com { ibge: pessoas } e a proveniência.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL_IBGE = 'https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[N3[23]]';
const rawDir = join(web, '../../data/populacao');
const rawFile = join(rawDir, 'ibge-censo2022-populacao-ce.json');
const metaFile = join(rawDir, 'ibge-censo2022-populacao-ce.meta.json');

let raw, baixadoEm;
if (process.argv.includes('--offline')) {
  raw = readFileSync(rawFile);
  baixadoEm = JSON.parse(readFileSync(metaFile, 'utf8')).baixado_em;
} else {
  const res = await fetch(URL_IBGE, { headers: { 'User-Agent': 'rastro-populacao' } });
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
  raw = Buffer.from(await res.arrayBuffer());
  baixadoEm = new Date().toISOString();
  mkdirSync(rawDir, { recursive: true });
  writeFileSync(rawFile, raw);
}
const sha256 = createHash('sha256').update(raw).digest('hex');
if (!existsSync(metaFile) || !process.argv.includes('--offline')) writeFileSync(metaFile, JSON.stringify({ fonte: 'IBGE — Censo 2022, população residente (agregado 4709, variável 93)', url: URL_IBGE, baixado_em: baixadoEm, sha256 }, null, 2));

const data = JSON.parse(raw.toString('utf8'));
const variavel = data[0];
if (variavel?.id !== '93' || variavel.unidade !== 'Pessoas') throw new Error('Resposta inesperada do IBGE: variável ou unidade diferente');
const series = variavel.resultados[0].series;
if (series.length !== 184) throw new Error(`Esperados 184 municípios, vieram ${series.length}`);
const pessoas = {};
for (const s of series) {
  const n = Number(s.serie['2022']);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`População inválida para ${s.localidade.id}`);
  pessoas[s.localidade.id] = n;
}
const out = { fonte: 'IBGE — Censo Demográfico 2022, população residente', url: URL_IBGE, baixado_em: baixadoEm, sha256, ano: 2022, pessoas };
writeFileSync(join(web, 'lib/populacao-ce.json'), JSON.stringify(out));
console.log(`[populacao] ${Object.keys(pessoas).length} municípios · total ${Object.values(pessoas).reduce((a, b) => a + b, 0).toLocaleString('pt-BR')} pessoas · sha256 ${sha256.slice(0, 12)}`);
