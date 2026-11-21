// Emendas ESTADUAIS do Ceará (SPEC 07, ADR-019). Carregamento no SERVIDOR; não importar em componentes de cliente.
// Export próprio em data/estaduais/ (python pipelines/run.py estaduais), separado do pacote federal: nada aqui se soma às federais.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DATA_MODE } from './dataset';

export type ValorKey = 'valor_emenda' | 'valor_lei' | 'valor_lei_creditos';
export const VALOR_KEYS: ValorKey[] = ['valor_emenda', 'valor_lei', 'valor_lei_creditos'];

export type Snapshot = { source_url: string; raw_sha256: string; downloaded_at: string; last_modified: string | null; bytes: number; raw_path: string };
export type ValorStats = { total: number | null; linhas_com_valor: number; linhas_nulas: number; linhas_zero: number };
export type Cobertura = {
  linhas: number; parlamentares_distintos: number; parlamentares_ligados: number; linhas_deputado_ligado: number;
  linhas_municipio_ligado: number; linhas_municipio_ambiguo: number; linhas_municipio_nao_resolvido: number; linhas_sem_municipio: number;
  municipios_distintos: number; beneficiarios: null; carater: Record<string, number>; tipo: Record<string, number>;
  valores: Record<ValorKey, ValorStats>;
};
export type EmendaEstadual = {
  id: string; ano: number; codigo: string; parlamentar: string | null; carater: string | null; tipo: string | null;
  orgao: string | null; funcao: string | null; acao: string | null; regiao: string | null;
  valor_emenda: number | null; valor_lei: number | null; valor_lei_creditos: number | null;
  municipio: { ibge: string | null; nome: string | null; regra: string | null; situacao: 'ligada' | 'ambigua' | 'nao_resolvida' | 'sem_municipio'; motivo: string | null };
  deputado: { slug: string | null; nome_alece: string | null; url_perfil: string | null; situacao: 'ligada' | 'ambigua' | 'nao_encontrado' | 'sem_nome'; motivo: string | null };
};
export type Estaduais = {
  kind: 'CE_ESTADUAIS_ORCAMENTO'; versao: 1; esfera: 'estadual'; aviso: string; fonte: string; fonte_pagina: string;
  dicionario: { url: string; snapshot: Snapshot | null; divergencias: string[] };
  snapshots: Record<string, Snapshot>; referencias: { ibge: Snapshot; alece: Snapshot };
  anos: number[]; colunas_valor: Record<ValorKey, string>; regras: string[]; regras_municipio: Record<string, string>;
  cobertura: Record<string, Cobertura>; referencias_externas: { id: string; texto: string; fonte: string; url: string | null }[];
  limitacoes: string[]; emendas: EmendaEstadual[];
};
export type EstaduaisResult = { ok: true; data: Estaduais; sha256: string } | { ok: false; demo: boolean; error: string };

const DIR = path.resolve(process.cwd(), '../../data/estaduais');
let cache: EstaduaisResult | null = null;

function validate(raw: Estaduais) {
  if (raw.kind !== 'CE_ESTADUAIS_ORCAMENTO' || raw.versao !== 1 || raw.esfera !== 'estadual') throw new Error('Export estadual inválido');
  if (!Array.isArray(raw.anos) || !Array.isArray(raw.emendas) || !raw.cobertura) throw new Error('Estrutura inválida');
  const ok = (v: unknown) => v === null || Number.isSafeInteger(v);
  for (const e of raw.emendas) if (!VALOR_KEYS.every(k => ok(e[k]))) throw new Error(`Valor inválido na emenda ${e.id}`);
  for (const c of Object.values(raw.cobertura)) if (!VALOR_KEYS.every(k => ok(c.valores[k].total))) throw new Error('Total inválido');
  for (const y of raw.anos) if (!raw.snapshots[String(y)] || !raw.cobertura[String(y)]) throw new Error(`Ano ${y} sem snapshot ou cobertura`);
  // Incremento 2: o slug vira segmento de URL (/estaduais/[slug]); um slug corresponde a um único nome da Alece.
  const nomes = new Map<string, string | null>();
  for (const e of raw.emendas) {
    if (e.deputado.situacao !== 'ligada') continue;
    if (!e.deputado.slug || !/^[a-z0-9-]+$/.test(e.deputado.slug) || !e.deputado.nome_alece) throw new Error(`Ligação de deputado inválida na emenda ${e.id}`);
    if (nomes.has(e.deputado.slug) && nomes.get(e.deputado.slug) !== e.deputado.nome_alece) throw new Error(`Slug ${e.deputado.slug} com mais de um nome da Alece`);
    nomes.set(e.deputado.slug, e.deputado.nome_alece);
  }
}

export type DeputadoLigado = { slug: string; nome: string; url_perfil: string | null; nomes_fonte: string[]; linhas_por_ano: { ano: number; linhas: number }[] };

/** Deputados com ao menos uma linha ligada pelo pipeline (nome exato e único na Alece), em ORDEM ALFABÉTICA.
 *  Só contagem de linhas por ano: nenhuma soma de valor por deputado (SPEC 07, incremento 2). */
export function deputadosLigados(data: Estaduais): DeputadoLigado[] {
  const by = new Map<string, { nome: string; url: string | null; fonte: Set<string>; anos: Map<number, number> }>();
  for (const e of data.emendas) {
    const d = e.deputado;
    if (d.situacao !== 'ligada' || !d.slug || !d.nome_alece) continue;
    const cur = by.get(d.slug) ?? { nome: d.nome_alece, url: d.url_perfil, fonte: new Set<string>(), anos: new Map<number, number>() };
    if (e.parlamentar) cur.fonte.add(e.parlamentar);
    cur.anos.set(e.ano, (cur.anos.get(e.ano) ?? 0) + 1);
    by.set(d.slug, cur);
  }
  return [...by.entries()].map(([slug, v]) => ({
    slug, nome: v.nome, url_perfil: v.url, nomes_fonte: [...v.fonte].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    linhas_por_ano: data.anos.filter(y => v.anos.has(y)).map(ano => ({ ano, linhas: v.anos.get(ano)! })),
  })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Lê o ponteiro, confere o SHA-256 do export e a estrutura. No modo demo não lê dados reais (Constituição, regra 16). */
export function getEstaduais(): EstaduaisResult {
  if (DATA_MODE === 'demo') return { ok: false, demo: true, error: 'A demonstração não carrega dados oficiais.' };
  if (cache) return cache;
  try {
    const pointer = JSON.parse(fs.readFileSync(path.join(DIR, 'ativo.json'), 'utf8'));
    if (pointer.versao !== 1 || typeof pointer.arquivo !== 'string' || !/^ce-estaduais-[\w-]+\.json$/.test(pointer.arquivo) || !/^[a-f0-9]{64}$/.test(pointer.sha256)) throw new Error('Ponteiro inválido');
    const content = fs.readFileSync(path.join(DIR, pointer.arquivo));
    const sha256 = createHash('sha256').update(content).digest('hex');
    if (sha256 !== pointer.sha256) throw new Error('SHA-256 do export não confere com o ponteiro');
    const data = JSON.parse(content.toString('utf8')) as Estaduais;
    validate(data);
    cache = { ok: true, data, sha256 };
  } catch (e) {
    cache = { ok: false, demo: false, error: `Export das emendas estaduais ausente ou inválido (${(e as Error).message}). Rode: python pipelines/run.py estaduais` };
  }
  return cache;
}
