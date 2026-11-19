// Carregamento do dataset no SERVIDOR (ADR-008). Não importar em componentes de cliente.
import fs from 'node:fs';
import path from 'node:path';
import { demoDataset } from './demo';
import type { AplicValues, DataMode, Dataset, DatasetResult, Place, YearValues } from './dataset-types';
import { demoAuthors } from './demo-authors';
import { demoEmendas, demoMunicipios } from './demo-fichas';
import type { Emenda, Municipio } from './fichas-types';
import type { Author, AuthorsData, AuthorsResult, Collective, StateDeputy } from './authors-types';

export const DATA_MODE: DataMode = process.env.DATA_MODE === 'validacao' ? 'validacao' : 'demo';
const VALIDATION_DIR = path.resolve(process.cwd(), '../../data/validacao');

type ExportFile = {
  kind: string; warning: string; coverage: string; source: string; source_url: string;
  snapshot: { raw_sha256: string; downloaded_at: string }; years: number[];
  municipalities: { ibge_code: string; name: string; years: Record<string, YearValues>; aplicacao?: Record<string, AplicValues> }[];
  non_municipal: { id: 'estado' | 'multiplo'; label: string; note: string; years: Record<string, YearValues> }[];
};

let cache: { file: string; result: DatasetResult } | null = null;

function loadValidation(): DatasetResult {
  let files: string[] = [];
  try {
    files = fs.readdirSync(VALIDATION_DIR).filter(f => /^ce-municipios-.*\.json$/.test(f)).sort();
  } catch {
    /* pasta ausente: tratado abaixo */
  }
  const file = files.at(-1);
  if (!file) return { ok: false, error: 'Nenhum export em data/validacao/. Rode: python pipelines/run.py all' };
  if (cache?.file === file) return cache.result;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(VALIDATION_DIR, file), 'utf-8')) as ExportFile;
    if (raw.kind !== 'VALIDACAO') return { ok: false, error: `Arquivo ${file} não é um export de validação.` };
    const municipalities: Place[] = raw.municipalities.map(m => ({ id: m.ibge_code, ibge: m.ibge_code, name: m.name, kind: 'municipio', years: m.years, aplicacao: m.aplicacao }));
    const nonMunicipal: Place[] = raw.non_municipal.map(n => ({ id: n.id, name: n.label, kind: n.id, note: n.note, years: n.years }));
    const data: Dataset = {
      mode: 'validacao',
      coverage: 'unverified',
      warning: raw.warning,
      source: raw.source,
      sourceUrl: raw.source_url,
      asOf: raw.snapshot.downloaded_at,
      snapshot: raw.snapshot.raw_sha256.slice(0, 8),
      years: raw.years,
      defaultYear: raw.years.at(-2) ?? raw.years[0], // último exercício completo (o atual ainda está em execução)
      municipalities,
      nonMunicipal,
    };
    cache = { file, result: { ok: true, data } };
    return cache.result;
  } catch (e) {
    return { ok: false, error: `Falha ao ler ${file}: ${(e as Error).message}` };
  }
}

let authorsCache: { file: string; result: AuthorsResult } | null = null;

/** Aba de autores (SPEC 04, T04.04): mesma regra de modo do explorador. */
export function getAuthors(): AuthorsResult {
  if (DATA_MODE === 'demo') return { ok: true, data: demoAuthors };
  let files: string[] = [];
  try {
    files = fs.readdirSync(VALIDATION_DIR).filter(f => /^autores-.*\.json$/.test(f)).sort();
  } catch {
    /* tratado abaixo */
  }
  const file = files.at(-1);
  if (!file) return { ok: false, error: 'Nenhum export de autores em data/validacao/. Rode: python pipelines/run.py autores' };
  if (authorsCache?.file === file) return authorsCache.result;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(VALIDATION_DIR, file), 'utf-8'));
    if (raw.kind !== 'VALIDACAO') return { ok: false, error: `Arquivo ${file} não é um export de validação.` };
    const data: AuthorsData = {
      mode: 'validacao', coverage: 'unverified', warning: raw.warning, source: raw.source,
      asOf: raw.snapshot.downloaded_at, partiesAsOf: raw.parlamentares_as_of, years: raw.years,
      authors: raw.authors as Author[], collective: raw.collective as Collective[],
      stateDeputies: (raw.state_deputies ?? []) as StateDeputy[], stateAsOf: raw.state_deputies_as_of ?? null,
      stateNote: raw.state_amendments_note ?? 'Emendas estaduais sem fonte estruturada verificada.',
    };
    authorsCache = { file, result: { ok: true, data } };
    return authorsCache.result;
  } catch (e) {
    return { ok: false, error: `Falha ao ler ${file}: ${(e as Error).message}` };
  }
}

// ---------- Fichas de emenda e de município (Frente B) ----------
type FichasResult<T> = { ok: true; data: Record<string, T> } | { ok: false; error: string };
const fichasCache: Record<string, { file: string; result: FichasResult<unknown> }> = {};

function loadFichas<T>(prefix: 'emendas' | 'municipios', key: 'emendas' | 'municipios'): FichasResult<T> {
  let files: string[] = [];
  try {
    files = fs.readdirSync(VALIDATION_DIR).filter(f => f.startsWith(`${prefix}-`) && f.endsWith('.json')).sort();
  } catch {
    /* tratado abaixo */
  }
  const file = files.at(-1);
  if (!file) return { ok: false, error: `Nenhum export de ${prefix} em data/validacao/. Rode: python pipelines/run.py fichas` };
  const cached = fichasCache[prefix];
  if (cached?.file === file) return cached.result as FichasResult<T>;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(VALIDATION_DIR, file), 'utf-8'));
    const result: FichasResult<T> = { ok: true, data: raw[key] };
    fichasCache[prefix] = { file, result };
    return result;
  } catch (e) {
    return { ok: false, error: `Falha ao ler ${file}: ${(e as Error).message}` };
  }
}

export function getEmendas(): FichasResult<Emenda> {
  return DATA_MODE === 'demo' ? { ok: true, data: demoEmendas } : loadFichas<Emenda>('emendas', 'emendas');
}
export function getMunicipios(): FichasResult<Municipio> {
  return DATA_MODE === 'demo' ? { ok: true, data: demoMunicipios } : loadFichas<Municipio>('municipios', 'municipios');
}

/** Nunca cai para dados demo em silêncio: em modo validação, erro é erro. */
export function getDataset(): DatasetResult {
  return DATA_MODE === 'validacao' ? loadValidation() : { ok: true, data: demoDataset };
}
